import { Link } from "react-router-dom";
import "./Stats.css";

const Stats = () => {
  const stats = [
    { label: "Documents Analyzed", value: "500K+" },
    { label: "Questions Answered", value: "2M+" },
    { label: "Active Users", value: "50K+" },
    { label: "Accuracy Rate", value: "99%" },
  ];

  return (
    <section className="stats dotted-bg">
      <div className="container">
        <h2 className="stats-title">
          The Most Powerful
          <br />
          Legal AI Platform
        </h2>
        <p className="stats-subtitle">
          Trusted by law firms, enterprises, and legal professionals worldwide
        </p>
        <div className="stats-cta">
          <Link to="/chat" className="btn btn-secondary">
            Explore The Platform
          </Link>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
