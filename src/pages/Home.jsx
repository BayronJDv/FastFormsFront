import { useEffect, useRef, useState } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const stepsRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate");
          }
        });
      },
      { threshold: 0.3 } // se activa cuando 30% es visible
    );

    if (stepsRef.current) {
      observer.observe(stepsRef.current);
    }

    return () => {
      if (stepsRef.current) {
        observer.unobserve(stepsRef.current);
      }
    };
  }, []);

  const [stats, setStats] = useState({
    time: 0,
    questions: 0,
    free: 0,
    users: 0,
  });

  const statsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animateNumbers();
        }
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const animateNumbers = () => {
  const duration = 1500;
  const start = performance.now();

  const endValues = {
    time: 2,
    questions: 12,
    free: 100,
    users: 0,
  };

  const animate = (now) => {
    const progress = Math.min((now - start) / duration, 1);

    setStats({
      time: Math.floor(progress * endValues.time),
      questions: Math.floor(progress * endValues.questions),
      free: Math.floor(progress * endValues.free),
      users: Math.floor(progress * endValues.users),
    });

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
};

  return (
    <div className="home">

      {/* HERO */}
      <section className="hero">

        <div className="badge">
          ✨ Más rápido que Google Forms
        </div>

        <h1>
          Crea encuestas en minutos,
          <br />
          obtén resultados al instante
        </h1>

        <p>
          Fast Forms es la forma más ágil de recolectar información.
          Sin complicaciones, sin curvas de aprendizaje.
          Solo encuestas rápidas y efectivas.
        </p>


        {/* CARD DEL CÓDIGO */}
        <div className="code-card">

          <p>¿Tienes un código de encuesta?</p>

          <div className="code-input">

            <input
              type="text"
              placeholder="Ingresa el código (ej. A7X9K)"
            />

            <button className="arrow-btn">
              →
            </button>

          </div>

        </div>


        {/* BOTONES */}
        <div className="hero-buttons">

          <button
            className="click-btn btn-style500"
            onClick={() => navigate("/create-survey")}
            >
            Crear mi primera encuesta 
          </button>

          <button className="secondary-btn">
            Ver demo del dashboard
          </button>

        </div>

      </section>

      {/* FEATURES */}

    <section className="features">

    <h2 className="masked-text">
      Todo lo que necesitas, nada que no
    </h2>

    <p className="features-subtitle">
        Diseñado para la simplicidad y velocidad. Crea encuestas profesionales sin la complejidad.
    </p>

    <div className="features-grid">

        <div className="feature-card">
        <div className="feature-icon">📋</div>
        <h3>3 Tipos de Pregunta</h3>
        <p>
            Preguntas abiertas, opción múltiple y Sí/No.
            Todo lo esencial sin complejidad innecesaria.
        </p>
        </div>

        <div className="feature-card">
        <div className="feature-icon">👥</div>
        <h3>Acceso por Código</h3>
        <p>
            Los encuestados solo necesitan un código único.
            Sin registros, sin complicaciones.
        </p>
        </div>

        <div className="feature-card">
        <div className="feature-icon">📊</div>
        <h3>Resultados en Tiempo Real</h3>
        <p>
            Visualiza respuestas con gráficos claros
            y métricas de participación al instante.
        </p>
        </div>

    </div>

    </section>

    {/* HOW IT WORKS */}

 
      <section className="steps" ref={stepsRef}>

    <h2>Así de simple</h2>
    <p className="steps-subtitle">
        Desde la idea hasta los resultados en tres pasos
    </p>

    <div className="steps-grid">

        <div className="step-card">
        <div className="step-number">1</div>
        <h3>Crea tu encuesta</h3>
        <p>
            Agrega hasta 12 preguntas usando nuestro
            constructor intuitivo
        </p>
        </div>

        <div className="step-card">
        <div className="step-number">2</div>
        <h3>Comparte el código</h3>
        <p>
            Distribuye el código único o el enlace
            directo a tus encuestados
        </p>
        </div>

        <div className="step-card">
        <div className="step-number">3</div>
        <h3>Analiza resultados</h3>
        <p>
            Visualiza las respuestas con gráficos
            y estadísticas en tiempo real
        </p>
        </div>

    </div>
    </section>



    {/* STATS */}

    <section className="stats" ref={statsRef}>

    <div className="stats-grid">

        <div className="stat-item">
          <h2>{stats.time}min</h2>
          <p>Tiempo promedio de creación</p>
        </div>

        <div className="stat-item">
          <h2>{stats.questions}</h2>
          <p>Preguntas máximas</p>
        </div>

        <div className="stat-item">
          <h2>{stats.free}%</h2>
          <p>Gratuito</p>
        </div>

        <div className="stat-item">
          <h2>{stats.users}</h2>
          <p>Registros requeridos para responder</p>
        </div>

    </div>

    </section>

    {/* AI SECTION */}

    <section className="ai-section">

    <div className="ai-badge">
        ⏱ Próximamente - V2
    </div>

    <h2 className="ai-title">
      {"Potenciado por IA".split("").map((char, index) => (
        <span key={index} className="letter">
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </h2>

    <div className="ai-grid">

        <div className="ai-card">
        <div className="ai-icon">✔</div>
        <h3>Generación Automática</h3>
        <p>
            La IA genera preguntas a partir
            de un contexto o prompt
        </p>
        </div>

        <div className="ai-card">
        <div className="ai-icon">✔</div>
        <h3>Respuestas por Voz</h3>
        <p>
            Speech-to-text para dictar
            respuestas fácilmente
        </p>
        </div>

        <div className="ai-card">
        <div className="ai-icon">✔</div>
        <h3>Análisis Inteligente</h3>
        <p>
            Resúmenes automáticos de
            respuestas abiertas
        </p>
        </div>

    </div>


    {/* CTA */}

    <div className="cta-section">

        <h2>¿Listo para crear tu encuesta?</h2>

        <p>
        Comienza gratis. Sin tarjeta de crédito.
        </p>

        <button
        className="cta-btn"
        onClick={() => navigate("/create-survey")}
        >
        Comenzar ahora →
        </button>

    </div>

    </section>

    </div>
    

  );

};

export default Home;