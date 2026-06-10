import { NavigateFunction } from "react-router-dom";

export function navigateToAlert(navigate: NavigateFunction, id?: string) {
  if (id) {
    navigate(`/alerts?id=${id}`);
  } else {
    navigate("/alerts");
  }
}

export function navigateToIncident(navigate: NavigateFunction, id?: string) {
  if (id) {
    navigate(`/incidents?id=${id}`);
  } else {
    navigate("/incidents");
  }
}

export function navigateToDevice(navigate: NavigateFunction, id?: string) {
  if (id) {
    navigate(`/devices?id=${id}`);
  } else {
    navigate("/devices");
  }
}
