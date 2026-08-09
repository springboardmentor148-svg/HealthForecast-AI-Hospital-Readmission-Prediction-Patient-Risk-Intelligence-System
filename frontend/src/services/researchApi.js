import axios from "axios";
import { readAuthUser } from "../shared/authStorage";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const token = readAuthUser()?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchPopulationStats = async () => {
  const res = await api.get("/research/population-stats");
  return res.data;
};

export const fetchRiskTrends = async () => {
  const res = await api.get("/research/risk-trends");
  return res.data;
};

export const fetchTreatmentAnalysis = async () => {
  const res = await api.get("/research/treatment-analysis");
  return res.data;
};

export const fetchOverviewStats = async () => {
  const res = await api.get("/research/overview-stats");
  return res.data;
};

export const fetchDatasets = async () => {
  const res = await api.get("/research/datasets");
  return res.data;
};

export const fetchExportHistory = async () => {
  const res = await api.get("/research/export-history");
  return res.data;
};

// Real CSV blob download — backend se file leke browser me save karwata hai
export const exportDataset = async (datasetKey, filename) => {
  const res = await api.get(`/research/export/${datasetKey}`, {
    responseType: "blob",
  });

  const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `${datasetKey}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};