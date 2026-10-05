import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { MapPin, Search } from "lucide-react";
import { toast } from "sonner";

/* ---------------- TYPES ---------------- */

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  total_slots: number;
  hourly_rate: number;
  image_url: string | null;
}

interface ParkingSlot {
  id: string;
  slot_number: string;
  status: "available" | "occupied";
}

/* ---------------- COMPONENT ---------------- */

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<Location | null>(null);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    occupied: 0,
  });

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  /* ---------------- FETCH LOCATIONS ---------------- */
  useEffect(() => {
    fetchLocations();
  }, []);

  /* ---------------- FETCH SLOTS ---------------- */
  useEffect(() => {
    if (selectedLocation) fetchSlots(selectedLocation.id);
  }, [selectedLocation]);

  /* ---------------- REALTIME UPDATES ---------------- */
  useEffect(() => {
    if (!selectedLocation) return;

    const channel = supabase
      .channel(`parking-slots-${selectedLocation.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parking_slots",
          filter: `location_id=eq.${selectedLocation.id}`,
        },
        () => {
          fetchSlots(selectedLocation.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedLocation]);

  /* ---------------- FUNCTIONS ---------------- */

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Failed to load locations");
      return;
    }

    setLocations(data || []);
    if (data && data.length > 0) {
      setSelectedLocation(data[0]);
    }
  };

  const fetchSlots = async (locationId: string) => {
    const { data, error } = await supabase
      .from("parking_slots")
      .select("*")
      .eq("location_id", locationId)
      .order("slot_number");

    if (error) {
      toast.error("Failed to load parking slots");
      return;
    }

    setSlots((data as ParkingSlot[]) || []);


    const total = data?.length || 0;
    const available =
      data?.filter((s) => s.status === "available").length || 0;
    const occupied =
      data?.filter((s) => s.status === "occupied").length || 0;

    setStats({ total, available, occupied });
  };

  const handleBookSlot = (slot: ParkingSlot) => {
    if (slot.status !== "available") {
      toast.error("This slot is not available");
      return;
    }

    navigate(
      `/booking?location=${selectedLocation?.id}&slot=${slot.id}`
    );
  };

  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Find Your Perfect Parking Spot
          </h1>
          <p className="text-muted-foreground">
            Real-time availability across all locations
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Total Slots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {stats.available}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Occupied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {stats.occupied}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LOCATIONS */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Locations</CardTitle>
              <CardDescription>
                Select a parking location
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredLocations.map((location) => (
                  <Button
                    key={location.id}
                    variant={
                      selectedLocation?.id === location.id
                        ? "default"
                        : "outline"
                    }
                    className="w-full justify-start h-auto py-3"
                    onClick={() => setSelectedLocation(location)}
                  >
                    <div className="flex gap-3 text-left w-full">
                      <MapPin className="h-5 w-5 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-semibold">
                          {location.name}
                        </div>
                        <div className="text-xs opacity-80 truncate">
                          {location.address}
                        </div>
                        <div className="text-xs mt-1">
                          <span className="font-semibold">
                            ₹{location.hourly_rate}/hr
                          </span>
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SLOTS */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Available Parking Slots</CardTitle>
              <CardDescription>
                {selectedLocation?.name} – Click on an available slot to
                book
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {slots.map((slot) => (
                  <Button
                    key={slot.id}
                    variant="outline"
                    size="sm"
                    className={`h-16 p-2 text-xs font-semibold transition-all
                      ${
                        slot.status === "available"
                          ? "slot-available hover:scale-105"
                          : "slot-occupied cursor-not-allowed"
                      }
                    `}
                    onClick={() => handleBookSlot(slot)}
                    disabled={slot.status !== "available"}
                  >
                    {slot.slot_number}
                  </Button>
                ))}
              </div>

              {/* LEGEND */}
              <div className="mt-6 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-accent rounded border" />
                  Available
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-destructive rounded border" />
                  Occupied
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
