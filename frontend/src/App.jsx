import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Registration from "./Registration";
import Dashboard from "./Dashboard";
import NewPrediction from "./NewPrediction";

import Patients from "./components/Patients";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/newprediction" element={<NewPrediction />} />
        <Route path="/patients" element={<Patients />} />
       
        <Route path="/newprediction" element={<NewPrediction />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;