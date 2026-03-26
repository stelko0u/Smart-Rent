'use client';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngExpression, LeafletMouseEvent } from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

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

interface MapComponentProps {
  offices: any[];
  editing: any;
  pos: [number, number] | null;
  setPos: (pos: [number, number] | null) => void;
  companyColors: Record<number, string>;
}

export default function MapComponent({
  offices,
  editing,
  pos,
  setPos,
  companyColors,
}: MapComponentProps) {
  if (typeof window === 'undefined') {
    return null; // Не рендерирайте картата на сървъра
  }
  function coloredMarker(color: string) {
    return L.divIcon({
      className: '',
      html: `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="${color}"
          xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="2.5" fill="white"/>
        </svg>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }

  return (
    <MapContainer
      center={pos ?? [42.7, 23.3]}
      zoom={12}
      style={{ height: 400, width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {offices.map((o) =>
        o.latitude && o.longitude ? (
          <Marker
            key={o.id}
            position={[o.latitude, o.longitude]}
            icon={coloredMarker(companyColors[o.companyId] ?? '#6b7280')}
          />
        ) : null,
      )}
      {editing && (
        <ClickMarker
          position={pos}
          onChange={(p: [number, number]) => setPos(p)}
        />
      )}
    </MapContainer>
  );
}
