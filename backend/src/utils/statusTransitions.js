const isValidTripTransition = (current, target) => {
  if (current === target) return true;
  
  const terminalStates = ["COMPLETED", "CANCELLED"];
  if (terminalStates.includes(current)) {
    return false;
  }

  if (["CANCELLED", "DELAYED"].includes(target)) {
    return true;
  }

  if (current === "SCHEDULED") {
    return ["DISPATCHED", "DELAYED", "CANCELLED"].includes(target);
  }
  if (current === "DISPATCHED") {
    return ["IN_TRANSIT", "DELAYED", "CANCELLED"].includes(target);
  }
  if (current === "IN_TRANSIT") {
    return ["COMPLETED", "DELAYED", "CANCELLED"].includes(target);
  }
  if (current === "DELAYED") {
    return ["SCHEDULED", "DISPATCHED", "IN_TRANSIT", "COMPLETED", "CANCELLED"].includes(target);
  }

  return false;
};

const isValidTicketTransition = (current, target) => {
  if (current === target) return true;

  if (current === "OPEN") {
    return ["IN_PROGRESS", "RESOLVED", "CLOSED"].includes(target);
  }
  if (current === "IN_PROGRESS") {
    return ["RESOLVED", "CLOSED"].includes(target);
  }
  if (current === "RESOLVED") {
    return ["CLOSED"].includes(target);
  }
  if (current === "CLOSED") {
    return false;
  }

  return false;
};

module.exports = {
  isValidTripTransition,
  isValidTicketTransition
};
