'use client';

import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

type Props = {
  lat: number;
  lng: number;
  label?: string;
};

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), {
      animate: true,
    });
  }, [lat, lng, map]);

  return null;
}

function createCustomMarker() {
  return L.divIcon({
    className: 'custom-car-marker-wrapper',
    html: `
      <div class="custom-car-marker">
        <div class="custom-car-marker__pin">
          <span class="custom-car-marker__emoji">🚗</span>
        </div>
        <div class="custom-car-marker__pulse"></div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 38],
    popupAnchor: [0, -34],
  });
}

export default function CarLocationMap({ lat, lng, label }: Props) {
  const [showOnMap, setShowOnMap] = useState(false);

  const title = useMemo(() => label || 'Локация на автомобила', [label]);

  const googleMapsUrl = useMemo(
    () => `https://www.google.com/maps?q=${lat},${lng}`,
    [lat, lng],
  );

  const markerIcon = useMemo(() => createCustomMarker(), []);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <style jsx>{`
        :global(.custom-car-marker-wrapper) {
          background: transparent;
          border: 0;
        }

        :global(.custom-car-marker) {
          position: relative;
          width: 44px;
          height: 44px;
        }

        :global(.custom-car-marker__pin) {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          box-shadow:
            0 10px 25px rgba(79, 70, 229, 0.35),
            0 4px 10px rgba(0, 0, 0, 0.18);
          border: 3px solid white;
          z-index: 2;
        }

        :global(.custom-car-marker__emoji) {
          font-size: 18px;
          line-height: 1;
          transform: translateY(-1px);
        }

        :global(.custom-car-marker__pulse) {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 44px;
          height: 44px;
          border-radius: 9999px;
          background: rgba(79, 70, 229, 0.22);
          transform: translate(-50%, -50%);
          animation: car-marker-pulse 1.8s ease-out infinite;
          z-index: 1;
        }

        @keyframes car-marker-pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.9);
            opacity: 0.8;
          }
          70% {
            transform: translate(-50%, -50%) scale(1.8);
            opacity: 0;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.8);
            opacity: 0;
          }
        }
      `}</style>

      <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
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
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Отвори в Google Maps
          </a>

          <button
            type="button"
            onClick={() => setShowOnMap((prev) => !prev)}
            className={`inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              showOnMap
                ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {showOnMap ? 'Скрий картата' : 'Покажи на карта'}
          </button>
        </div>
      </div>

      {!showOnMap ? (
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
                onClick={() => setShowOnMap(true)}
                className="inline-flex items-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Покажи картата
              </button>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Отвори в Google Maps
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative h-[420px] w-full">
          <div className="absolute left-4 top-4 z-[500] rounded-2xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <div className="mt-1 text-xs text-slate-500">
              Координати: {lat.toFixed(5)}, {lng.toFixed(5)}
            </div>
          </div>

          <div className="absolute right-4 top-4 z-[500]">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
            >
              Google Maps
            </a>
          </div>

          <MapContainer
            center={[lat, lng]}
            zoom={13}
            scrollWheelZoom={false}
            className="h-full w-full"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Recenter lat={lat} lng={lng} />
            <Marker position={[lat, lng]} icon={markerIcon}>
              <Popup>
                <div className="min-w-[200px]">
                  <div className="font-semibold text-slate-900">{title}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Latitude: {lat.toFixed(5)}
                  </div>
                  <div className="text-sm text-slate-600">
                    Longitude: {lng.toFixed(5)}
                  </div>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Отвори в Google Maps
                  </a>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      )}
    </div>
  );
}
