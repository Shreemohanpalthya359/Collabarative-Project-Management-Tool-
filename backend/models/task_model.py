from database.db import db

class Task(db.Model):

    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(db.String(200))

    status = db.Column(db.String(50))

    project_id = db.Column(db.Integer)