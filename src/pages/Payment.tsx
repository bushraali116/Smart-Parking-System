import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

// ✅ IMPORT STATIC QR IMAGE
import paymentQR from "../assets/payment-qr.jpeg";

const Payment = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const locationId = searchParams.get("location")!;
  const slotId = searchParams.get("slot")!;
  const startTime = searchParams.get("start")!;
  const duration = Number(searchParams.get("duration"));
  const vehicleNumber = searchParams.get("vehicle")!;

  const [location, setLocation] = useState<any>(null);
  const [slot, setSlot] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  /* ---------------- FETCH DETAILS ---------------- */
  useEffect(() => {
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
    const { data: loc } = await supabase
      .from("locations")
      .select("*")
      .eq("id", locationId)
      .single();

    const { data: sl } = await supabase
      .from("parking_slots")
      .select("*")
      .eq("id", slotId)
      .single();

    setLocation(loc);
    setSlot(sl);
  };

  /* ---------------- HANDLE PAYMENT ---------------- */
  const handlePayment = async () => {
    if (!user || !location) return;

    setProcessing(true);

    try {
      // Simulate payment success
      await new Promise((r) => setTimeout(r, 2000));

      const start = new Date(startTime);
      const end = new Date(start.getTime() + duration * 3600000);
      const totalCost = location.hourly_rate * duration;

      /* -------- CREATE BOOKING -------- */
      const { error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          location_id: locationId,
          slot_id: slotId,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          duration_hours: duration,
          total_cost: totalCost,
          vehicle_number: vehicleNumber,
          status: "confirmed",
        });

      if (bookingError) {
        toast.error("Booking failed");
        setProcessing(false);
        return;
      }

      /* -------- UPDATE SLOT STATUS -------- */
      const { error: slotError } = await supabase
        .from("parking_slots")
        .update({ status: "occupied" })
        .eq("id", slotId);

      if (slotError) {
        toast.error("Failed to update slot status");
        setProcessing(false);
        return;
      }

      setCompleted(true);
      toast.success("Payment successful!");
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error during payment");
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !location || !slot) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  /* ---------------- SUCCESS SCREEN ---------------- */
  if (completed) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto text-success mb-4" />
              <CardTitle>Booking Confirmed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p>
                Slot <strong>{slot.slot_number}</strong> booked successfully
              </p>
              <div className="flex gap-4">
                <Button onClick={() => navigate("/booking-history")} className="flex-1">
                  View Bookings
                </Button>
                <Button variant="outline" onClick={() => navigate("/dashboard")} className="flex-1">
                  Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /* ---------------- PAYMENT SCREEN ---------------- */
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Scan to Pay</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">

            {/* ✅ STATIC PAYMENT QR IMAGE */}
            {/* ✅ STATIC PAYMENT QR IMAGE */}
            <img
              src={paymentQR}
              alt="Payment QR Code"
              className="mx-auto w-64 h-64 border rounded-lg"
            />

            <p className="text-xs text-muted-foreground">
              UPI ID: 7307081007@ptyes
            </p>


            {/* ✅ QR HOLDER NAME */}
            <p className="text-lg font-semibold mt-2">
              Bushra Ali
            </p>

            <p className="text-sm text-muted-foreground">
              Scan this QR using any UPI app and then click <b>Complete Payment</b>
            </p>

            <Button
              onClick={handlePayment}
              disabled={processing}
              className="w-full"
              size="lg"
            >
              {processing ? "Processing..." : "Complete Payment"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payment;
