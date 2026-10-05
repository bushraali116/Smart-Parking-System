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
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { DollarSign, Car, TrendingUp, MapPin, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    occupancyRate: 0,
    availableSlots: 0,
  });
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [newSlotData, setNewSlotData] = useState({
    slot_number: "",
    floor: 1,
    section: "A",
  });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/");
      toast.error("Access denied. Admin only.");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchStats();
      fetchLocations();
    }
  }, [user, isAdmin]);

  const fetchStats = async () => {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("total_cost, status");

    const totalRevenue =
      bookings
        ?.filter(
          (b) => b.status === "confirmed" || b.status === "completed"
        )
        .reduce((sum, b) => sum + parseFloat(b.total_cost.toString()), 0) || 0;

    const totalBookings = bookings?.length || 0;

    const { data: slots } = await supabase.from("parking_slots").select("status");

    const availableSlots =
      slots?.filter((s) => s.status === "available").length || 0;
    const totalSlots = slots?.length || 1;
    const occupiedSlots =
      slots?.filter((s) => s.status === "occupied").length || 0;
    const occupancyRate = (occupiedSlots / totalSlots) * 100;

    setStats({
      totalRevenue,
      totalBookings,
      occupancyRate,
      availableSlots,
    });
  };

  const fetchLocations = async () => {
    const { data } = await supabase.from("locations").select("*").order("name");
    setLocations(data || []);
    if (data && data.length > 0) {
      setSelectedLocation(data[0].id);
    }
  };

  const handleAddSlot = async () => {
    if (!selectedLocation || !newSlotData.slot_number) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsAddingSlot(true);

    const { error } = await supabase.from("parking_slots").insert({
      location_id: selectedLocation,
      slot_number: newSlotData.slot_number,
      floor: newSlotData.floor,
      section: newSlotData.section,
      status: "available",
    });

    if (error) {
      toast.error("Failed to add slot: " + error.message);
    } else {
      toast.success("Slot added successfully");
      setNewSlotData({ slot_number: "", floor: 1, section: "A" });
      fetchStats();
    }

    setIsAddingSlot(false);
  };

  const handleDeleteSlot = async (slotId) => {
    const { error } = await supabase.from("parking_slots").delete().eq("id", slotId);

    if (error) {
      toast.error("Failed to delete slot");
    } else {
      toast.success("Slot deleted successfully");
      fetchStats();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                ₹{stats.totalRevenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Car className="h-4 w-4" />
                Total Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalBookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Occupancy Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {stats.occupancyRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Available Slots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">
                {stats.availableSlots}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Slot Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Slot Management</CardTitle>
                <CardDescription>Add or remove parking slots</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Slot
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Parking Slot</DialogTitle>
                    <DialogDescription>
                      Enter the details for the new parking slot
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Select
                        value={selectedLocation}
                        onValueChange={setSelectedLocation}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id}>
                              {loc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="slot_number">Slot Number</Label>
                      <Input
                        id="slot_number"
                        placeholder="A1"
                        value={newSlotData.slot_number}
                        onChange={(e) =>
                          setNewSlotData({
                            ...newSlotData,
                            slot_number: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="floor">Floor</Label>
                      <Input
                        id="floor"
                        type="number"
                        min="1"
                        value={newSlotData.floor}
                        onChange={(e) =>
                          setNewSlotData({
                            ...newSlotData,
                            floor: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="section">Section</Label>
                      <Input
                        id="section"
                        placeholder="A"
                        value={newSlotData.section}
                        onChange={(e) =>
                          setNewSlotData({
                            ...newSlotData,
                            section: e.target.value,
                          })
                        }
                      />
                    </div>

                    <Button
                      onClick={handleAddSlot}
                      className="w-full"
                      disabled={isAddingSlot}
                    >
                      {isAddingSlot ? "Adding..." : "Add Slot"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">
              Total Locations: {locations.length}
            </p>
            <p className="text-sm text-muted-foreground">
              Use the "Add Slot" button to create new parking slots for your
              locations.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
