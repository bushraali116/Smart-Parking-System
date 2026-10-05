import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Car, MapPin, Clock, Shield, TrendingUp } from "lucide-react";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
              <Car className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Smart Parking Solution</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold max-w-4xl">
              Find & Book Your Perfect{" "}
              <span className="text-primary">Parking Spot</span> in Seconds
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl">
              Real-time availability, instant booking, and seamless payment. 
              The smartest way to park in the city.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <Button asChild size="lg" className="text-lg px-8">
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="text-lg px-8">
                    <Link to="/auth">Get Started</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-lg px-8">
                    <Link to="/auth">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center card-hover">
            <CardContent className="pt-6 pb-6">
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <p className="text-muted-foreground">Parking Locations</p>
            </CardContent>
          </Card>
          
          <Card className="text-center card-hover">
            <CardContent className="pt-6 pb-6">
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <p className="text-muted-foreground">Happy Customers</p>
            </CardContent>
          </Card>
          
          <Card className="text-center card-hover">
            <CardContent className="pt-6 pb-6">
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <p className="text-muted-foreground">Satisfaction Rate</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose SmartPark?
            </h2>
            <p className="text-xl text-muted-foreground">
              Experience the future of parking management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Real-Time Availability</h3>
                <p className="text-muted-foreground">
                  See live parking slot availability across all locations instantly.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Quick Booking</h3>
                <p className="text-muted-foreground">
                  Reserve your spot in under 30 seconds with our streamlined process.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="bg-success/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-success" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure Payment</h3>
                <p className="text-muted-foreground">
                  Safe and encrypted payment processing for peace of mind.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="bg-warning/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-warning" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Smart Analytics</h3>
                <p className="text-muted-foreground">
                  Track your parking history and optimize your costs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardContent className="py-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Experience Smart Parking?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of satisfied customers today
            </p>
            <Button asChild size="lg" variant="secondary" className="text-lg px-8">
              <Link to={user ? "/dashboard" : "/auth"}>
                {user ? "Go to Dashboard" : "Sign Up Now"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Car className="h-5 w-5" />
            <span className="font-semibold">SmartPark</span>
          </div>
          <p className="text-sm">© 2024 SmartPark. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
