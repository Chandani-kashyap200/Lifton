import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Bike, Car, Truck, Package, Box, Home, MapPin, CreditCard, Wallet, Banknote } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type ServiceType = Database['public']['Enums']['service_type'];
type PaymentMode = Database['public']['Enums']['payment_mode'];

interface BookingFormProps {
  defaultService?: string;
  onSuccess?: () => void;
}

const services: { id: ServiceType; icon: any; name: string }[] = [
  { id: 'bike_taxi', icon: Bike, name: 'Bike Taxi' },
  { id: 'auto_rickshaw', icon: Car, name: 'Auto Rickshaw' },
  { id: 'cab', icon: Car, name: 'Cab' },
  { id: 'parcel_delivery', icon: Package, name: 'Parcel Delivery' },
  { id: 'heavy_goods', icon: Truck, name: 'Heavy Goods' },
  { id: 'packers_movers', icon: Home, name: 'Packers & Movers' },
  { id: 'intercity_goods', icon: MapPin, name: 'Intercity Goods' },
];

const paymentModes: { id: PaymentMode; icon: any; name: string }[] = [
  { id: 'cash', icon: Banknote, name: 'Cash' },
  { id: 'online', icon: CreditCard, name: 'Online Payment' },
  { id: 'wallet', icon: Wallet, name: 'Wallet' },
];

export const BookingForm = ({ defaultService, onSuccess }: BookingFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [serviceType, setServiceType] = useState<ServiceType>(
    (defaultService as ServiceType) || 'cab'
  );
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState<any[]>([]);

  useEffect(() => {
    fetchPricing();
  }, []);

  useEffect(() => {
    if (pickup && drop && pricing.length > 0) {
      calculateFare();
    }
  }, [pickup, drop, serviceType, pricing]);

  const fetchPricing = async () => {
    const { data } = await supabase.from('service_pricing').select('*');
    setPricing(data || []);
  };

  const calculateFare = () => {
    // Simple distance estimation (in production, use Maps API)
    const estimatedDistance = Math.random() * 15 + 2; // 2-17 km
    setDistance(Math.round(estimatedDistance * 10) / 10);

    const servicePricing = pricing.find(p => p.service_type === serviceType);
    if (servicePricing) {
      const fare = Math.max(
        servicePricing.minimum_fare,
        servicePricing.base_fare + (estimatedDistance * servicePricing.per_km_rate)
      );
      setEstimatedFare(Math.round(fare));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !estimatedFare) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('bookings').insert({
        user_id: user.id,
        service_type: serviceType,
        pickup_address: pickup,
        drop_address: drop,
        distance_km: distance,
        estimated_fare: estimatedFare,
        payment_mode: paymentMode,
        notes: notes || null,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: 'Booking Created!',
        description: 'Looking for available drivers...',
      });

      setPickup('');
      setDrop('');
      setNotes('');
      setEstimatedFare(null);
      setDistance(null);
      
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Booking Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="font-display">Book a Ride</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Selection */}
            <div>
              <Label className="mb-3 block">Select Service</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setServiceType(service.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      serviceType === service.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <service.icon className={`w-6 h-6 mx-auto mb-2 ${
                      serviceType === service.id ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <div className={`text-sm font-medium ${
                      serviceType === service.id ? 'text-primary' : ''
                    }`}>
                      {service.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pickup & Drop */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickup">Pickup Location</Label>
                <Input
                  id="pickup"
                  placeholder="Enter pickup address"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="drop">Drop Location</Label>
                <Input
                  id="drop"
                  placeholder="Enter drop address"
                  value={drop}
                  onChange={(e) => setDrop(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Payment Mode */}
            <div>
              <Label className="mb-3 block">Payment Mode</Label>
              <div className="flex gap-3">
                {paymentModes.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPaymentMode(mode.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      paymentMode === mode.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <mode.icon className="w-4 h-4" />
                    {mode.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Fare Estimate */}
            {estimatedFare && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-primary/10 border border-primary/20"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Estimated Distance</div>
                    <div className="font-semibold">{distance} km</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Estimated Fare</div>
                    <div className="font-display text-2xl font-bold text-primary">₹{estimatedFare}</div>
                  </div>
                </div>
              </motion.div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading || !estimatedFare}>
              {loading ? 'Creating Booking...' : 'Confirm Booking'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};
