import React from "react";

export default function Stop({ stop, color }) {
  const primaryIndex = stop.services.findLastIndex(
    (serviceList) => serviceList.length > 0
  );

  return (
    <div className="stop-list-item">
      {stop.services.map((serviceList, index, arr) => (
        <div
          key={index}
          className={`service ${serviceList.length > 0 && "inactive"} ${
            index === primaryIndex ? "active primary" : ""
          } ${stop.start ? "start" : ""} ${
            stop.connect[index] ? "connect" : ""
          }`}
        >
          {(stop.start || stop.connect.some((c) => c)) && (
            <div className="service-list">
              {serviceList.map((service) => (
                <span
                  className="service-icon"
                  style={{ backgroundColor: color }}
                >
                  {service}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
      <span className="stop-name">{stop.name}</span>
    </div>
  );
}
