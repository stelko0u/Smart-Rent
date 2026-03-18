'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L, { LatLngExpression, LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon paths for Next.js / Webpack
const DefaultIcon = L.Icon.Default as any;
delete DefaultIcon.prototype._getIconUrl;
DefaultIcon.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface LeafletMapProps {
  offices: any[];
  editing: any | null;
  pos: [number, number] | null;
  setPos: React.Dispatch<React.SetStateAction<[number, number] | null>>;
}

// Marker that listens to map clicks
function ClickMarker({
  position,
  onChange,
}: {
  position: LatLngExpression | null;
  onChange: (p: [number, number]) => void;
}) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onChange([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function LeafletMap({
  offices,
  editing,
  pos,
  setPos,
}: LeafletMapProps) {
  return (
    <MapContainer
      center={pos ?? [42.7, 23.3]}
      zoom={12}
      style={{ height: 400, width: '100%' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {offices.map(
        (o) =>
          o.latitude &&
          o.longitude && (
            <Marker key={o.id} position={[o.latitude, o.longitude]} />
          ),
      )}
      {editing && <ClickMarker position={pos} onChange={setPos} />}
    </MapContainer>
  );
}
