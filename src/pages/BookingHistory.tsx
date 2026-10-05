import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Calendar, MapPin, Clock, DollarSign, XCircle } from "lucide-react";

interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  total_cost: number;
  status: "confirmed" | "completed" | "cancelled";
  qr_code: string | null;
  vehicle_number: string | null;
  slot_id: string;
  locations: {
    name: string;
    address: string;
  };
  parking_slots: {
    slot_number: string;
  };
}

const BookingHistory = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  /* ---------------- FETCH BOOKINGS ---------------- */
  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        id,
        start_time,
        end_time,
        duration_hours,
        total_cost,
        status,
        qr_code,
        vehicle_number,
        slot_id,
        locations (name, address),
        parking_slots (slot_number)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load bookings");
      setIsLoading(false);
      return;
    }

    setBookings((data as Booking[]) || []);
    setIsLoading(false);
  };

  /* ---------------- CANCEL BOOKING ---------------- */
  const handleCancelBooking = async (booking: Booking) => {
    if (!user) return;

    const confirm = window.confirm(
      "Are you sure you want to cancel this booking?"
    );
    if (!confirm) return;

    setCancellingId(booking.id);

    try {
      /* 1️⃣ Update booking status */
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", booking.id);

      if (bookingError) {
        toast.error("Failed to cancel booking");
        setCancellingId(null);
        return;
      }

      /* 2️⃣ Release parking slot */
      const { error: slotError } = await supabase
        .from("parking_slots")
        .update({ status: "available" })
        .eq("id", booking.slot_id);

      if (slotError) {
        toast.error("Failed to release parking slot");
        setCancellingId(null);
        return;
      }

      /* 3️⃣ Update UI instantly */
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id ? { ...b, status: "cancelled" } : b
        )
      );

      toast.success("Booking cancelled successfully");
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error while cancelling");
    } finally {
      setCancellingId(null);
    }
  };

  /* ---------------- HELPERS ---------------- */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-success text-success-foreground";
      case "completed":
        return "bg-muted text-muted-foreground";
      case "cancelled":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-warning text-warning-foreground";
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading || isLoading) {
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
        <h1 className="text-3xl font-bold mb-6">My Booking History</h1>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No bookings found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{booking.locations.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {booking.locations.address}
                      </CardDescription>
                    </div>

                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Start Time
                        </p>
                        <p className="font-semibold">
                          {formatDate(booking.start_time)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Duration
                        </p>
                        <p className="font-semibold">
                          {booking.duration_hours} hours
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Cost
                        </p>
                        <p className="font-semibold">
                          ₹{booking.total_cost}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Slot Number
                      </p>
                      <p className="font-semibold">
                        {booking.parking_slots.slot_number}
                      </p>
                    </div>
                  </div>

                  {/* QR */}
                  {booking.qr_code && booking.status === "confirmed" && (
                    <img
                      src={booking.qr_code}
                      alt="QR Code"
                      className="w-32 h-32 border rounded"
                    />
                  )}

                  {/* CANCEL BUTTON */}
                  {booking.status === "confirmed" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelBooking(booking)}
                      disabled={cancellingId === booking.id}
                      className="flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      {cancellingId === booking.id
                        ? "Cancelling..."
                        : "Cancel Booking"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;
