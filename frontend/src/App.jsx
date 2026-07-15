import { useEffect, useState } from "react";
import API from "./services/api";

function App() {

  const [message, setMessage] = useState("");

  useEffect(() => {

    API.get("/")
      .then((response) => {
        setMessage(response.data.message);
      })
      .catch((error) => {
        console.log(error);
      });

  }, []);

  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "100px",
        fontFamily: "Arial"
      }}
    >
      <h1>HealthForecast AI</h1>

      <h2>{message}</h2>

    </div>
  );
}

export default App;