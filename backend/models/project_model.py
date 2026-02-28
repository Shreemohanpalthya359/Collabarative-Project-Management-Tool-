from database.db import db

class Project(db.Model):

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(200))

    description = db.Column(db.String(500))