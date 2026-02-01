def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "rag-agent"
    assert "models" in data
    assert "embedding" in data["models"]
    assert "chat" in data["models"]
    assert "agent" in data["models"]


def test_health_reports_key_status(client):
    response = client.get("/health")
    data = response.json()
    # Keys won't be set in test env, so these should be False
    assert isinstance(data["has_openai_key"], bool)
    assert isinstance(data["has_groq_key"], bool)
    assert isinstance(data["has_minimax_key"], bool)
