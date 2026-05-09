"use client";

import { useEffect, useState } from "react";
import EmptyState from "@/components/EmptyState";
import { ListSkeleton } from "@/components/LoadingSkeleton";
import PatientsTable from "@/components/PatientsTable";
import { getDoctorPatients } from "@/lib/backend-api";
import { useSessionUser } from "@/lib/hooks";
import { roleLabels, type PatientRow } from "@/types";

export default function MyPatientsPage() {
  const sessionUser = useSessionUser();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPatients = () => {
    if (!sessionUser || sessionUser.role !== "DOCTOR") {
      setLoading(false);
      return;
    }

    setLoading(true);

    getDoctorPatients(sessionUser.id)
      .then((data) => {
        setPatients(data);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let active = true;

    if (!sessionUser || sessionUser.role !== "DOCTOR") {
      return undefined;
    }

    setLoading(true);

    getDoctorPatients(sessionUser.id)
      .then((data) => {
        if (active) {
          setPatients(data);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [sessionUser]);

  if (!sessionUser) {
    return <ListSkeleton rows={3} />;
  }

  if (sessionUser.role !== "DOCTOR") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
          <p className="text-sm font-medium text-slate-900">Мои пациенты</p>
          <p>{roleLabels[sessionUser.role]}</p>
        </div>
        <EmptyState
          title="Нет персональной очереди"
          description="Войдите под учетной записью врача, чтобы увидеть назначенных пациентов и исследования в работе."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <p className="text-sm font-medium text-slate-900">Мои пациенты</p>
        <p>{loading ? "Загрузка..." : `${patients.length} строк`}</p>
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : patients.length === 0 ? (
        <EmptyState
          title="У вас пока нет пациентов в работе"
          description="Как только вы возьмете новое исследование из общей очереди, оно появится здесь вместе с дедлайном и статусом."
        />
      ) : (
        <PatientsTable rows={patients} onRowsChanged={loadPatients} />
      )}
    </div>
  );
}
