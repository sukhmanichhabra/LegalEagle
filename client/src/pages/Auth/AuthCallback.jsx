import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the hash from URL
        const hash = window.location.hash;
        console.log("AuthCallback - hash:", hash);

        if (!hash || !hash.includes("access_token")) {
          console.error("No access token in hash");
          navigate("/login");
          return;
        }

        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (!accessToken || !refreshToken) {
          console.error("Missing tokens");
          navigate("/login");
          return;
        }

        // Set the session
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error("Error setting session:", error);
          alert("Authentication failed: " + error.message);
          navigate("/login");
          return;
        }

        if (data.session) {
          // Store user data
          localStorage.setItem("userToken", data.session.access_token);
          localStorage.setItem("userEmail", data.session.user.email);
          localStorage.setItem("userId", data.session.user.id);

          const userName =
            data.session.user.user_metadata?.name ||
            data.session.user.email.split("@")[0];
          localStorage.setItem("userName", userName);

          // Redirect to dashboard
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        console.error("Exception in auth callback:", err);
        navigate("/login");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f8fafc",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "4px solid #e2e8f0",
            borderTop: "4px solid #ff4d00",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <h2 style={{ color: "#1e293b", marginBottom: "8px" }}>
          Signing you in...
        </h2>
        <p style={{ color: "#64748b" }}>Please wait</p>
      </div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default AuthCallback;
