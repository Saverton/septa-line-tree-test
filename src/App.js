import { useState, useEffect } from "react";
import "./App.css";
import Stop from "./Stop";

const T = {
  services: ["T1", "T5", "T2", "T4", "T3"],
  color: "green",
};
const BSL = {
  services: ["B2", "B1", "B3"],
  color: "orangered",
};

function arrayCompare(a, b) {
  return a.every((ea) => b.includes(ea));
}

function App() {
  // eslint-disable-next-line no-undef
  const [stopList, setStopList] = useState([]);
  const [services, setServices] = useState(BSL.services);
  const [direction, setDirection] = useState(0);
  const [color, setColor] = useState(BSL.color);

  // eslint-disable-next-line no-undef
  useEffect(() => {
    (async function () {
      const stops = {};
      for (let service of services) {
        const url = `https://s3.amazonaws.com/flat-api.septa.org/metro/stops/${service}/stops.json`;

        const rawStops = await fetch(url).then((response) => response.json());

        stops[service] = rawStops
          .filter(
            (s) => s.release_name === "20230903" && s.direction_id === direction
          )
          .sort((a, b) => a.stop_sequence - b.stop_sequence);
      }

      // create large stops list
      let combinedStops = [];
      for (let service of services) {
        let runningStops = [];
        let lastIndex = 0;
        for (let stop of stops[service]) {
          const stopIndex = combinedStops.findIndex(
            (s) => s.stop_id === stop.stop_id
          );

          if (stopIndex !== -1) {
            // if found, insert running stops + add service
            lastIndex = stopIndex + runningStops.length;
            combinedStops[stopIndex].route_id += ` ${stop.route_id}`;
            if (runningStops.length > 0) {
              combinedStops = [
                ...combinedStops.slice(0, stopIndex),
                ...runningStops,
                ...combinedStops.slice(stopIndex),
              ];
              runningStops = [];
            }
          } else {
            // if not found add to running stops
            runningStops.push(stop);
          }
        }

        if (runningStops.length > 0) {
          combinedStops = [
            ...combinedStops.slice(0, lastIndex),
            ...runningStops,
            ...combinedStops.slice(lastIndex),
          ];
        }
      }

      const serviceBounds = {};
      for (let service of services) {
        const firstStop = stops[service][0];
        const lastStop = stops[service][stops[service].length - 1];
        serviceBounds[service] = {
          start: combinedStops.findIndex(
            (s) => s.stop_id === firstStop.stop_id
          ),
          end: combinedStops.findIndex((s) => s.stop_id === lastStop.stop_id),
        };
      }

      const displayStops = combinedStops.reduce((combined, current, index) => {
        const previous = index > 0 ? combined[index - 1] : null;

        let stopServices = previous ? [...previous.services] : [];
        const activeServices = current.route_id.split(" ");
        stopServices = stopServices
          .map((serviceList) =>
            serviceList.filter(
              (service) =>
                !activeServices.includes(service) &&
                serviceBounds[service].end >= index
            )
          )
          .filter((a) => a.length > 0);
        stopServices.push(activeServices);

        const start =
          previous === null ||
          activeServices.every(
            (service) => !previous.services.flat().includes(service)
          );

        let connect = stopServices.map((serviceList, index) => {
          if (previous === null) {
            return false;
          }

          if (
            previous.services[index] &&
            !arrayCompare(previous.services[index], serviceList)
          ) {
            return true;
          } else {
            return false;
          }
        });

        for (let i = connect.length; i < previous?.services.length; i++) {
          const prev = previous?.services[connect.length];

          if (prev?.some((p) => stopServices.flat().includes(p))) {
            connect[connect.length - 1] = true;
          }
          connect.push(false);
        }

        while (stopServices.length < connect.length) {
          stopServices.push([]);
        }

        const stop = {
          id: current.stop_id,
          name: current.stop_name,
          services: stopServices,
          start,
          connect,
        };

        combined.push(stop);
        return combined;
      }, []);
      setStopList(displayStops);
    })();
  }, [services, direction]);

  const handleSetService = (service) => {
    setStopList([]);
    setServices(service.services);
    setColor(service.color);
  };

  const toggleDirection = () => {
    setDirection((direction) => (direction === 0 ? 1 : 0));
  };

  return (
    <>
      <button onClick={() => handleSetService(BSL)}>See BSL</button>
      <button onClick={() => handleSetService(T)}>See T</button>
      <button onClick={toggleDirection}>Change Direction</button>
      <ul>
        {stopList.map((s) => (
          <li key={s.id} style={{ color: color }}>
            <Stop stop={s} color={color} />
          </li>
        ))}
      </ul>
    </>
  );
}

export default App;
