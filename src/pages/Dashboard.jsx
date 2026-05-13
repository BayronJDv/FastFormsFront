import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { userAtom } from "../stores/authAtom";
import { useNavigate } from "react-router-dom";
import { listDrafts } from "../lib/apiClient";

const Dashboard = () => {
  const [user] = useAtom(userAtom);
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listDrafts();
        if (!cancelled) setDrafts(data || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1>{user?.name}</h1>
      <div>Dashboard</div>
      <button onClick={() => navigate("/create-survey")}>Create Survey</button>

      <section style={{ marginTop: "2rem" }}>
        <h2>Mis borradores</h2>
        {loading && <p>Cargando borradores...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
        {!loading && !error && drafts.length === 0 && (
          <p>No tienes borradores guardados.</p>
        )}
        {!loading && drafts.length > 0 && (
          <ul>
            {drafts.map((d) => {
              const titleLabel =
                d.title && d.title !== "(sin titulo)"
                  ? d.title
                  : "(sin título)";
              const count = d.questions?.length || 0;
              return (
                <li key={d.id}>
                  <button onClick={() => navigate(`/create-survey/${d.id}`)}>
                    {titleLabel} — {count} pregunta{count === 1 ? "" : "s"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
