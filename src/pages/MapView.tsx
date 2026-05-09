import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STADIUM_COORDS: Record<string, { lat: number; lng: number }> = {
  "Emirates Stadium": { lat: 51.5549, lng: -0.1084 },
  "Villa Park": { lat: 52.5092, lng: -1.8847 },
  "Vitality Stadium": { lat: 50.7352, lng: -1.8383 },
  "Gtech Community Stadium": { lat: 51.4888, lng: -0.2886 },
  "Amex Stadium": { lat: 50.8618, lng: -0.0831 },
  "Stamford Bridge": { lat: 51.4816, lng: -0.1909 },
  "Selhurst Park": { lat: 51.3983, lng: -0.0855 },
  "Goodison Park": { lat: 53.4388, lng: -2.9664 },
  "Craven Cottage": { lat: 51.4749, lng: -0.2218 },
  "Elland Road": { lat: 53.7779, lng: -1.5724 },
  "Anfield": { lat: 53.4308, lng: -2.9608 },
  "Etihad Stadium": { lat: 53.4831, lng: -2.2004 },
  "Old Trafford": { lat: 53.4631, lng: -2.2913 },
  "St. James' Park": { lat: 54.9756, lng: -1.6218 },
  "City Ground": { lat: 52.9399, lng: -1.1327 },
  "Stadium of Light": { lat: 54.9146, lng: -1.3883 },
  "Tottenham Hotspur Stadium": { lat: 51.6043, lng: -0.0665 },
  "London Stadium": { lat: 51.5386, lng: -0.0164 },
  "Molineux Stadium": { lat: 52.5902, lng: -2.1302 },
  "St Andrew's": { lat: 52.4758, lng: -1.8686 },
  "Ewood Park": { lat: 53.7286, lng: -2.4891 },
  "Ashton Gate": { lat: 51.4400, lng: -2.6201 },
  "The Valley": { lat: 51.4865, lng: 0.0366 },
  "Coventry Building Society Arena": { lat: 52.4482, lng: -1.4964 },
  "Pride Park": { lat: 52.9149, lng: -1.4469 },
  "MKM Stadium": { lat: 53.7454, lng: -0.3678 },
  "Portman Road": { lat: 52.0544, lng: 1.1449 },
  "King Power Stadium": { lat: 52.6204, lng: -1.1422 },
  "Riverside Stadium": { lat: 54.5782, lng: -1.2175 },
  "The Den": { lat: 51.4859, lng: -0.0507 },
  "Carrow Road": { lat: 52.6221, lng: 1.3094 },
  "Kassam Stadium": { lat: 51.7169, lng: -1.2118 },
  "Fratton Park": { lat: 50.7965, lng: -1.0641 },
  "Deepdale": { lat: 53.7724, lng: -2.6869 },
  "Loftus Road": { lat: 51.5093, lng: -0.2322 },
  "Bramall Lane": { lat: 53.3703, lng: -1.4705 },
  "Hillsborough Stadium": { lat: 53.4114, lng: -1.5008 },
  "St Mary's Stadium": { lat: 50.9058, lng: -1.3914 },
  "bet365 Stadium": { lat: 52.9883, lng: -2.1754 },
  "Swansea.com Stadium": { lat: 51.6430, lng: -3.9345 },
  "Vicarage Road": { lat: 51.6498, lng: -0.4017 },
  "The Hawthorns": { lat: 52.5092, lng: -1.9642 },
  "Racecourse Ground": { lat: 53.0489, lng: -2.9927 },
  "Kenilworth Road": { lat: 51.8836, lng: -0.4317 },
  "Weston Homes Stadium": { lat: 52.5735, lng: -0.2376 },
  "Home Park": { lat: 50.3880, lng: -4.1438 },
  "Select Car Leasing Stadium": { lat: 51.4534, lng: -0.9826 },
  "Edgeley Park": { lat: 53.4058, lng: -2.1577 },
  "DW Stadium": { lat: 53.5455, lng: -2.6655 },
  "Valley Parade": { lat: 53.8042, lng: -1.7793 },
  "Oakwell Stadium": { lat: 53.5525, lng: -1.4671 },
  "Bloomfield Road": { lat: 53.8041, lng: -3.0483 },
  "Cardiff City Stadium": { lat: 51.4733, lng: -3.2028 },
  "John Smith's Stadium": { lat: 53.6544, lng: -1.7686 },
  "Brisbane Road": { lat: 51.5601, lng: -0.0134 },
  "LNER Stadium": { lat: 53.2279, lng: -0.5406 },
  "Abbey Stadium": { lat: 52.2057, lng: 0.1406 },
  "Priestfield Stadium": { lat: 51.3847, lng: 0.5496 },
  "Blundell Park": { lat: 53.5740, lng: -0.0623 },
  "Meadow Lane": { lat: 52.9432, lng: -1.1358 },
  "Boundary Park": { lat: 53.5551, lng: -2.1286 },
  "County Ground": { lat: 51.5637, lng: -1.7726 },
  "Prenton Park": { lat: 53.3724, lng: -3.0945 },
  "Bescot Stadium": { lat: 52.5687, lng: -1.9961 },
};

type StadiumPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  visitCount: number;
  avgGrade: number;
  visited: boolean;
};

type FilterMode = "mine" | "all";

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const MapView = () => {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("mine");
  const [pins, setPins] = useState<StadiumPin[]>([]);
  const [selectedPin, setSelectedPin] = useState<StadiumPin | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    if (window.google) { setMapsLoaded(true); return; }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&callback=initMap`;
    script.async = true;
    script.defer = true;
    window.initMap = () => setMapsLoaded(true);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  // Fetch stadium data
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: matches } = await supabase
        .from("matches")
        .select("stadium_id, atmosphere, view_rating, scran, damage, user_id");

      const { data: stadiums } = await supabase
        .from("stadiums")
        .select("id, name");

      if (!matches || !stadiums) { setLoading(false); return; }

      const myVisitedStadiumIds = new Set(
        matches.filter((m: any) => m.user_id === user.id).map((m: any) => m.stadium_id)
      );

      const statsMap = new Map<string, { sum: number; n: number; visited: boolean }>();
      matches.forEach((m: any) => {
        const avg = (m.atmosphere + m.view_rating + m.scran + m.damage) / 4;
        const cur = statsMap.get(m.stadium_id) ?? { sum: 0, n: 0, visited: false };
        cur.sum += avg;
        cur.n += 1;
        if (m.user_id === user.id) cur.visited = true;
        statsMap.set(m.stadium_id, cur);
      });

      const result: StadiumPin[] = [];
      stadiums.forEach((s: any) => {
        const coords = STADIUM_COORDS[s.name];
        if (!coords) return;
        const stats = statsMap.get(s.id);
        if (!stats) return;
        result.push({
          id: s.id,
          name: s.name,
          lat: coords.lat,
          lng: coords.lng,
          visitCount: stats.n,
          avgGrade: stats.sum / stats.n,
          visited: myVisitedStadiumIds.has(s.id),
        });
      });

      setPins(result);
      setLoading(false);
    })();
  }, [user]);

  // Init map
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current) return;
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 52.8, lng: -1.5 },
      zoom: 6,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#0f1117" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0f1117" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#1f2937" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1117" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
      ],
      disableDefaultUI: true,
      zoomControl: true,
    });
  }, [mapsLoaded]);

  // Update markers when pins or filter changes
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const displayed = filter === "mine" ? pins.filter(p => p.visited) : pins;

    displayed.forEach(pin => {
      const color = pin.avgGrade >= 7.5 ? "#84cc16" : pin.avgGrade >= 5 ? "#f59e0b" : "#ef4444";
      const marker = new window.google.maps.Marker({
        position: { lat: pin.lat, lng: pin.lng },
        map: mapInstanceRef.current,
        title: pin.name,
        icon: {
          path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
          fillColor: pin.visited ? color : "#4b5563",
          fillOpacity: 1,
          strokeColor: "#0f1117",
          strokeWeight: 1,
          scale: 1.8,
          anchor: new window.google.maps.Point(12, 22),
        },
      });

      marker.addListener("click", () => setSelectedPin(pin));
      markersRef.current.push(marker);
    });
  }, [pins, filter, mapsLoaded]);

  const gradeColor = (g: number) =>
    g >= 7.5 ? "text-rating-good" : g >= 5 ? "text-rating-mid" : "text-rating-bad";

  return (
    <AppShell title="Map">
      <div className="-mx-5 -mt-5 relative" style={{ height: "calc(100vh - 8rem)" }}>
        {/* Filter toggle */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          {(["mine", "all"] as FilterMode[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-widest transition-all shadow-lg",
                filter === f
                  ? "bg-gradient-primary text-primary-foreground"
                  : "bg-card text-muted-foreground border border-border"
              )}
            >
              {f === "mine" ? "My Visits" : "All Stadiums"}
            </button>
          ))}
        </div>

        {/* Visit count badge */}
        {filter === "mine" && (
          <div className="absolute top-4 right-4 z-10 bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
            <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Visited</p>
            <p className="font-display text-2xl tracking-wider text-primary leading-none">
              {pins.filter(p => p.visited).length}
            </p>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <div ref={mapRef} className="w-full h-full" />

        {/* Selected pin card */}
        {selectedPin && (
          <div
            className="absolute bottom-4 left-4 right-4 z-10 stat-card space-y-1"
            onClick={() => setSelectedPin(null)}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-extrabold text-lg leading-tight">{selectedPin.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedPin.visitCount} {selectedPin.visitCount === 1 ? "review" : "reviews"}
                  {selectedPin.visited && " · ✓ You've been here"}
                </p>
              </div>
              <div className="text-right">
                <p className={cn("font-display text-3xl tracking-wider leading-none", gradeColor(selectedPin.avgGrade))}>
                  {selectedPin.avgGrade.toFixed(1)}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">avg grade</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default MapView;