import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Clock, X, Phone } from 'lucide-react';

interface ActiveBookingProps {
  booking: any;
  onUpdate: () => void;
}

export const ActiveBooking = ({ booking, onUpdate }: ActiveBookingProps) => {
  const { toast } = useToast();

  const handleCancel = async () => {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: 'Cancelled by user',
      })
      .eq('id', booking.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Could not cancel booking',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Booking Cancelled',
        description: 'Your booking has been cancelled',
      });
      onUpdate();
    }
  };

  const getStatusMessage = () => {
    switch (booking.status) {
      case 'pending':
        return 'Looking for drivers...';
      case 'accepted':
        return 'Driver is on the way!';
      case 'in_progress':
        return 'Ride in progress';
      default:
        return booking.status;
    }
  };

  const getStatusColor = () => {
    switch (booking.status) {
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'accepted':
        return 'bg-success text-success-foreground';
      case 'in_progress':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card className="dashboard-card border-primary/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Badge className={getStatusColor()}>
                {getStatusMessage()}
              </Badge>
              <div className="mt-2 text-sm text-muted-foreground">
                {booking.service_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </div>
            </div>
            {booking.status === 'pending' && (
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-success" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Pickup</div>
                <div className="font-medium text-sm">{booking.pickup_address}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-destructive" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Drop</div>
                <div className="font-medium text-sm">{booking.drop_address}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {booking.distance_km} km
              </div>
            </div>
            <div className="font-display text-xl font-bold text-primary">
              ₹{booking.estimated_fare}
            </div>
          </div>

          {booking.status === 'accepted' && (
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Driver assigned
              </div>
              <Button size="sm" variant="outline">
                <Phone className="w-4 h-4 mr-1" />
                Call Driver
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
