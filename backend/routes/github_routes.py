from flask import Blueprint, jsonify
import requests
import os

github_bp = Blueprint("github", __name__)

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
HEADERS = {
    "Authorization": f"token {GITHUB_TOKEN}"
} if GITHUB_TOKEN else {}

# 1️⃣ Get GitHub user profile
@github_bp.route("/github/user/<username>", methods=["GET"])
def get_github_user(username):
    url = f"https://api.github.com/users/{username}"
    r = requests.get(url, headers=HEADERS)

    if r.status_code != 200:
        return jsonify({"error": "User not found"}), 404

    data = r.json()
    return jsonify({
        "username": data["login"],
        "name": data.get("name"),
        "public_repos": data["public_repos"],
        "followers": data["followers"]
    })

# 2️⃣ Get user repositories
@github_bp.route("/github/repos/<username>", methods=["GET"])
def get_repos(username):
    url = f"https://api.github.com/users/{username}/repos"
    r = requests.get(url, headers=HEADERS)

    if r.status_code != 200:
        return jsonify({"error": "Repos not found"}), 404

    repos = r.json()
    return jsonify([
        {
            "name": repo["name"],
            "stars": repo["stargazers_count"],
            "language": repo["language"]
        } for repo in repos
    ])

# 3️⃣ Get commits of a repo
@github_bp.route("/github/commits/<username>/<repo>", methods=["GET"])
def get_commits(username, repo):
    url = f"https://api.github.com/repos/{username}/{repo}/commits"
    r = requests.get(url, headers=HEADERS)

    if r.status_code != 200:
        return jsonify({"error": "Commits not found"}), 404

    commits = r.json()
    return jsonify([
        {
            "message": c["commit"]["message"],
            "author": c["commit"]["author"]["name"]
        } for c in commits[:10]
    ])