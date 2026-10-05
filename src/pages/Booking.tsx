import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Calendar, Clock, Car } from "lucide-react";

const Booking = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const locationId = searchParams.get("location")!;
  const slotId = searchParams.get("slot")!;

  const [location, setLocation] = useState<any>(null);
  const [slot, setSlot] = useState<any>(null);

  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(1);
  const [vehicleNumber, setVehicleNumber] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
    const { data: locationData } = await supabase
      .from("locations")
      .select("*")
      .eq("id", locationId)
      .single();

    const { data: slotData } = await supabase
      .from("parking_slots")
      .select("*")
      .eq("id", slotId)
      .single();

    setLocation(locationData);
    setSlot(slotData);
  };

  const calculateCost = () =>
    location ? (location.hourly_rate * duration).toFixed(2) : "0.00";

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();

    navigate(
      `/payment?location=${locationId}&slot=${slotId}&start=${startTime}&duration=${duration}&vehicle=${vehicleNumber}`
    );
  };

  if (loading || !location || !slot) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Complete Your Booking</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{location.name}</p>
            <p className="text-sm text-muted-foreground">{location.address}</p>
            <p className="mt-2">
              <strong>Slot:</strong> {slot.slot_number}
            </p>
            <p className="mt-1">₹{location.hourly_rate}/hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Information</CardTitle>
            <CardDescription>Enter your details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProceed} className="space-y-4">
              <div>
                <Label>Vehicle Number</Label>
                <Input
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Start Time</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4" />
                  <Input
                    type="datetime-local"
                    className="pl-10"
                    min={new Date().toISOString().slice(0, 16)}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Duration (hours)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4" />
                  <Input
                    type="number"
                    min={1}
                    max={24}
                    className="pl-10"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between">
                  <span>Total Cost:</span>
                  <span className="font-bold">₹{calculateCost()}</span>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Proceed to Payment
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Booking;
