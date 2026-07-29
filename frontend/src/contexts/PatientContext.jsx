import React, { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';
import {
  createPatient,
  deletePatient,
  getPatient,
  listPatients,
  updatePatient,
} from '../api/patients';

const PatientContext = createContext();

export function PatientProvider({ children }) {
  const { isAuthReady, isAuthenticated } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [isPatientsLoading, setIsPatientsLoading] = useState(false);
  const [patientsError, setPatientsError] = useState('');

  const syncSelectedPatient = (nextPatients, currentSelected) => {
    if (!currentSelected) return;
    const match = nextPatients.find((patient) => patient.id === currentSelected.id);
    if (match) {
      setSelectedPatient(match);
    }
  };

  const loadPatients = async (params = {}) => {
    setIsPatientsLoading(true);
    setPatientsError('');
    try {
      const nextPatients = await listPatients(params);
      setPatients(nextPatients);
      syncSelectedPatient(nextPatients, selectedPatient);
      return nextPatients;
    } catch (error) {
      setPatientsError(error?.message || 'Unable to load patients.');
      throw error;
    } finally {
      setIsPatientsLoading(false);
    }
  };

  const selectPatient = async (patientOrId) => {
    if (!patientOrId) {
      setSelectedPatient(null);
      return null;
    }

    if (typeof patientOrId === 'object') {
      setSelectedPatient(patientOrId);
      return patientOrId;
    }

    const patientId = String(patientOrId);
    const localMatch = patients.find((patient) => patient.id === patientId);
    if (localMatch) {
      setSelectedPatient(localMatch);
      return localMatch;
    }

    const fetched = await getPatient(patientId);
    setSelectedPatient(fetched);
    setPatients((current) => {
      const exists = current.some((patient) => patient.id === fetched.id);
      return exists
        ? current.map((patient) => (patient.id === fetched.id ? fetched : patient))
        : [fetched, ...current];
    });
    return fetched;
  };

  const refreshPatients = async (params = {}) => {
    return loadPatients(params);
  };

  const createPatientRecord = async (payload) => {
    const created = await createPatient(payload);
    await loadPatients();
    setSelectedPatient(created);
    return created;
  };

  const updatePatientRecord = async (patientId, payload) => {
    const updated = await updatePatient(patientId, payload);
    setSelectedPatient(updated);
    await loadPatients();
    return updated;
  };

  const deletePatientRecord = async (patientId) => {
    await deletePatient(patientId);
    if (selectedPatient?.id === String(patientId)) {
      setSelectedPatient(null);
    }
    await loadPatients();
  };

  useEffect(() => {
    let isActive = true;

    async function initializePatients() {
      if (!isAuthReady) return;
      if (!isAuthenticated) {
        if (!isActive) return;
        setPatients([]);
        setSelectedPatient(null);
        setCurrentPrediction(null);
        setPatientsError('');
        return;
      }

      try {
        await loadPatients();
      } catch {
        if (!isActive) return;
      }
    }

    initializePatients();

    return () => {
      isActive = false;
    };
    // selectedPatient is intentionally excluded so the bootstrap effect only tracks auth state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, isAuthenticated]);

  return (
    <PatientContext.Provider
      value={{
        patients,
        selectedPatient,
        setSelectedPatient: selectPatient,
        selectPatient,
        currentPrediction,
        setCurrentPrediction,
        isPatientsLoading,
        patientsError,
        loadPatients: refreshPatients,
        refreshPatients,
        createPatientRecord,
        updatePatientRecord,
        deletePatientRecord,
        getPatientById: selectPatient,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}

PatientProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function usePatient() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
}
