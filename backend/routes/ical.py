"""iCal export route — generates .ics file for ALL project tasks and sprints."""
from flask import Blueprint, Response
from models import Task, Sprint, Project
from routes.auth import token_required
from datetime import datetime, timezone, timedelta

ical_bp = Blueprint('ical', __name__)

def _ical_dt(dt):
    """Format datetime for iCal (UTC)."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.strftime('%Y%m%dT%H%M%SZ')

def _ical_date(dt):
    """Format as all-day date (no time)."""
    return dt.strftime('%Y%m%d')

def _escape(text):
    return (text or '').replace('\\', '\\\\').replace('\n', '\\n').replace(',', '\\,').replace(';', '\\;')

@ical_bp.route('/project/<int:project_id>', methods=['GET'])
@token_required
def export_project_ical(current_user, project_id):
    _ = current_user
    project = Project.query.get_or_404(project_id)
    tasks = Task.query.filter_by(project_id=project_id).all()
    sprints = Sprint.query.filter_by(project_id=project_id).all()

    now = _ical_dt(datetime.utcnow())
    status_map = {'todo': 'NEEDS-ACTION', 'in_progress': 'IN-PROCESS', 'done': 'COMPLETED'}

    lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        f'PRODID:-//GitManager//{_escape(project.name)}//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        f'X-WR-CALNAME:{_escape(project.name)}',
    ]

    for t in tasks:
        uid = f"task-{t.id}@gitmanager"
        vstatus = status_map.get(t.status, 'NEEDS-ACTION')
        priority_map = {'high': '1', 'medium': '5', 'low': '9'}
        vpriority = priority_map.get(t.priority, '5')

        if t.due_date:
            # Task has a due date — proper timed event
            dtstart = _ical_dt(t.due_date)
            dtend = _ical_dt(t.due_date + timedelta(hours=1))
            lines += [
                'BEGIN:VEVENT',
                f'UID:{uid}',
                f'DTSTAMP:{now}',
                f'DTSTART:{dtstart}',
                f'DTEND:{dtend}',
                f'SUMMARY:{"✅ " if t.status == "done" else "🔲 "}{_escape(t.title)}',
                f'DESCRIPTION:Project: {_escape(project.name)}\\nPriority: {t.priority}\\nStatus: {t.status}{"\\nAssigned to: " + str(t.assignee_id) if t.assignee_id else ""}',
                f'STATUS:{vstatus}',
                f'PRIORITY:{vpriority}',
                'END:VEVENT',
            ]
        else:
            # No due date — use creation date as an all-day event
            created = t.created_at or datetime.utcnow()
            date_str = _ical_date(created)
            next_date = _ical_date(created + timedelta(days=1))
            lines += [
                'BEGIN:VEVENT',
                f'UID:{uid}',
                f'DTSTAMP:{now}',
                f'DTSTART;VALUE=DATE:{date_str}',
                f'DTEND;VALUE=DATE:{next_date}',
                f'SUMMARY:{"✅ " if t.status == "done" else "🔲 "}{_escape(t.title)} [no due date]',
                f'DESCRIPTION:Project: {_escape(project.name)}\\nPriority: {t.priority}\\nStatus: {t.status}',
                f'STATUS:{vstatus}',
                f'PRIORITY:{vpriority}',
                'END:VEVENT',
            ]

    # Sprints → spanning VEVENT (fall back to creation date if no dates set)
    for s in sprints:
        uid = f"sprint-{s.id}@gitmanager"
        status_emoji = {'planned': '📋', 'active': '🏃', 'completed': '🏁'}.get(s.status, '📌')

        if s.start_date and s.end_date:
            dtstart = _ical_dt(s.start_date)
            dtend = _ical_dt(s.end_date)
        else:
            # No dates set — use creation date as a single all-day event
            created = s.created_at or datetime.utcnow()
            dtstart = f'DTSTART;VALUE=DATE:{_ical_date(created)}'
            dtend = f'DTEND;VALUE=DATE:{_ical_date(created + timedelta(days=1))}'
            lines += [
                'BEGIN:VEVENT',
                f'UID:{uid}',
                f'DTSTAMP:{now}',
                dtstart,
                dtend,
                f'SUMMARY:{status_emoji} Sprint: {_escape(s.name)} [{s.status}]',
                f'DESCRIPTION:Sprint status: {s.status}\\nSet start/end dates in the Sprints page for a proper range.',
                'END:VEVENT',
            ]
            continue

        lines += [
            'BEGIN:VEVENT',
            f'UID:{uid}',
            f'DTSTAMP:{now}',
            f'DTSTART:{dtstart}',
            f'DTEND:{dtend}',
            f'SUMMARY:{status_emoji} Sprint: {_escape(s.name)}',
            f'DESCRIPTION:Sprint status: {s.status}',
            'END:VEVENT',
        ]

    lines.append('END:VCALENDAR')
    ical_content = '\r\n'.join(lines)
    filename = f"{project.name.replace(' ', '_')}_calendar.ics"
    return Response(
        ical_content,
        mimetype='text/calendar',
        headers={'Content-Disposition': f'attachment; filename="{filename}"'}
    )
