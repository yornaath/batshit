import React from "react";
import { EventEmitter } from "events";
import { groupBy } from "lodash-es";
import {
  Devtools,
  create,
  BatshitEvent,
} from "@yornaath/batshit/dist/devtools";

const emitter = new EventEmitter();
const eventsMemory: BatshitEvent<any, any>[] = [];

window.__BATSHIT_DEVTOOLS__ = create((event) => {
  eventsMemory.push(event);
  emitter.emit("event", event);
});

export const BatshitDevtools = () => {
  const events = React.useSyncExternalStore<BatshitEvent<any, any>[]>(
    (callback) => {
      emitter.addListener("event", callback);
      return () => {
        emitter.removeListener("event", callback);
      };
    },
    () => eventsMemory
  );

  const eventsByBatcher = groupBy(events, (event) => event.name);

  return (
    <div>
      {Object.entries(eventsByBatcher).map(([name, events]) => {
        return <BatcherEvents name={name} events={events} />;
      })}
    </div>
  );
};

export const BatcherEvents = (props: {
  name: string;
  events: BatshitEvent<any, any>[];
}) => {
  return (
    <div>
      <h2>{props.name}</h2>
      {JSON.stringify(props.events, null, 2)}
    </div>
  );
};
