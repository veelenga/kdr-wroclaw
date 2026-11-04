import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import { categoryMeta } from '../lib/categories.ts'
import type { LatLng } from '../lib/geo.ts'
import type { Partner } from '../types.ts'
import { PartnerCard } from './PartnerCard.tsx'

interface Props {
  partners: Partner[]
  center: LatLng
  origin: LatLng | null
  favorites: ReadonlySet<string>
  onToggleFavorite: (id: string) => void
}

const renderer = L.canvas({ padding: 0.5 })
const POPUP_WIDTH = 360
const POPUP_MARGIN = 56

const popupWidth = () => Math.min(POPUP_WIDTH, window.innerWidth - POPUP_MARGIN)

function FitToOrigin({ origin }: { origin: LatLng | null }) {
  const map = useMap()
  useEffect(() => {
    if (origin) map.setView([origin.lat, origin.lng], 14)
  }, [map, origin])
  return null
}

export function MapView({ partners, center, origin, favorites, onToggleFavorite }: Props) {
  const located = partners.filter((p) => p.location)
  const width = popupWidth()
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={12} className="map" renderer={renderer}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToOrigin origin={origin} />
      {origin && (
        <CircleMarker
          center={[origin.lat, origin.lng]}
          radius={9}
          pathOptions={{ color: '#111', fillColor: '#fff', fillOpacity: 1, weight: 3 }}
        />
      )}
      {located.map((p) => {
        const { color } = categoryMeta(p.categories[0]?.name ?? '')
        return (
          <CircleMarker
            key={p.id}
            center={[p.location!.lat, p.location!.lng]}
            radius={6}
            pathOptions={{ color: '#fff', weight: 1.5, fillColor: color, fillOpacity: 0.9 }}
          >
            <Popup maxWidth={width} minWidth={width}>
              <PartnerCard
                partner={p}
                favorite={favorites.has(p.id)}
                onToggleFavorite={onToggleFavorite}
                origin={origin}
                compact
              />
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
