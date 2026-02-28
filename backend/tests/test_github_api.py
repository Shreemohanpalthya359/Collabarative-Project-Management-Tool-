def test_github_user(client):
    res = client.get("/api/github/user/octocat")
    assert res.status_code == 200

def test_invalid_github_user(client):
    res = client.get("/api/github/user/invaliduser123456")
    assert res.status_code == 404