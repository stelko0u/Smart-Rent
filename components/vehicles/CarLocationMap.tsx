'use client';

import { useEffect, useId, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

type Props = {
  lat: number;
  lng: number;
  label?: string;
};

const DEFAULT_TITLE = 'Локация на автомобила';
const ZOOM_LEVEL = 13;
const CENTER_EPSILON = 0.00001;

const classes = {
  topLink:
    'inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50',
  primaryButton:
    'inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold transition',
  heroButton:
    'inline-flex items-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700',
  secondaryButton:
    'inline-flex items-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50',
  mapLink:
    'inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800',
};

const carMarkerIcon = L.divIcon({
  className: 'bg-transparent border-0',
  html: `
    <div class="relative h-[44px] w-[44px]">
      <div
        class="absolute left-1/2 top-1/2 h-[68px] w-[68px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/45 animate-ping"
        style="animation-duration: 2.6s;"
      ></div>

      <div
        class="absolute left-1/2 top-1/2 h-[68px] w-[68px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/30 animate-ping"
        style="animation-delay: 1.2s; animation-duration: 2.6s;"
      ></div>

      <div class="absolute inset-0 z-[2] flex items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-br from-indigo-600 to-violet-600 shadow-[0_10px_25px_rgba(79,70,229,0.45),0_4px_12px_rgba(0,0,0,0.22)]">
        <span class="text-[18px] leading-none -translate-y-[1px]">🚗</span>
      </div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 38],
  popupAnchor: [0, -34],
});

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    const center = map.getCenter();
    const hasSameLat = Math.abs(center.lat - lat) < CENTER_EPSILON;
    const hasSameLng = Math.abs(center.lng - lng) < CENTER_EPSILON;

    if (hasSameLat && hasSameLng) {
      return;
    }

    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);

  return null;
}

export default function CarLocationMap({ lat, lng, label }: Props) {
  const [showMap, setShowMap] = useState(false);
  const headingId = useId();

  const title = label?.trim() || DEFAULT_TITLE;
  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  const formattedLat = lat.toFixed(5);
  const formattedLng = lng.toFixed(5);

  return (
    <section
      aria-labelledby={headingId}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 id={headingId} className="text-lg font-semibold text-slate-900">
            Локация на автомобила
          </h3>
          <p className="text-sm text-slate-500">
            Провери местоположението и отвори директно в Google Maps
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className={classes.topLink}
          >
            Отвори в Google Maps
          </a>

          <button
            type="button"
            onClick={() => setShowMap((prev) => !prev)}
            aria-expanded={showMap}
            aria-controls="car-location-map-panel"
            className={`${classes.primaryButton} ${
              showMap
                ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {showMap ? 'Скрий картата' : 'Покажи на карта'}
          </button>
        </div>
      </div>

      {!showMap ? (
        <div className="flex h-72 items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50 px-6 text-center">
          <div className="max-w-md">
            <div className="mb-4 text-5xl">📍</div>

            <h4 className="mb-2 text-xl font-semibold text-slate-900">
              {title}
            </h4>

            <p className="mb-5 text-sm text-slate-600">
              Натисни бутона, за да отвориш картата, или отвори координатите
              директно в Google Maps.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowMap(true)}
                className={classes.heroButton}
              >
                Покажи картата
              </button>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className={classes.secondaryButton}
              >
                Отвори в Google Maps
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div id="car-location-map-panel" className="relative h-[420px] w-full">
          <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-2xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <div className="mt-1 text-xs text-slate-500">
              Координати: {formattedLat}, {formattedLng}
            </div>
          </div>

          <div className="absolute right-4 top-4 z-[500]">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className={classes.mapLink}
            >
              Google Maps
            </a>
          </div>

          <MapContainer
            center={[lat, lng]}
            zoom={ZOOM_LEVEL}
            scrollWheelZoom={false}
            className="h-full w-full"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <RecenterMap lat={lat} lng={lng} />

            <Marker position={[lat, lng]} icon={carMarkerIcon}>
              <Popup>
                <div className="min-w-[200px]">
                  <div className="font-semibold text-slate-900">{title}</div>

                  <div className="mt-1 text-sm text-slate-600">
                    Latitude: {formattedLat}
                  </div>

                  <div className="text-sm text-slate-600">
                    Longitude: {formattedLng}
                  </div>

                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
                  >
                    Отвори в Google Maps
                  </a>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      )}
    </section>
  );
}
