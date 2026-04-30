// src/pages/Recommendation.tsx

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// --- Remove Leaflet Imports ---
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';
// import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
// import iconUrl from 'leaflet/dist/images/marker-icon.png';
// import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { BiCurrentLocation } from "react-icons/bi";
import Swal from 'sweetalert2';
import axios from 'axios';

// --- Import Google Maps Components ---
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Import the service and type for your custom user profile
import { getUserProfile, saveUserProfile, UserProfile } from '@/services/firebase/userService';
import { useAuth } from "@/context/AuthContext";

// Import Checkbox component
import { Checkbox } from "@/components/ui/checkbox"; 

// --- Remove Leaflet Icon Fix ---
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({ ... });

// Mock data (remains the same)
const CROP_OPTIONS = [ /* ... crop list ... */
  "Acai Berry", "Adzuki Bean", "Almond", "Amaranth", "Anise",
  "Apple", "Apricot", "Areca Nut", "Artichoke", "Arugula",
  "Ash Gourd", "Asparagus", "Avocado", "Bael", "Bambara Groundnut",
  "Bamboo", "Banana", "Barley", "Barnyard Millet", "Basil",
  "Beetroot", "Bell Pepper", "Betel Vine", "Bitter Gourd", "Black Cumin",
  "Black Gram (Vigna mungo)", "Black Pepper", "Blackberry", "Blueberry", "Bottle Gourd",
  "Brazil Nut", "Breadfruit", "Broccoli", "Buckwheat", "Cabbage",
  "Cacao", "Canola", "Carambola (Starfruit)", "Cardamom", "Carrot",
  "Cashew", "Cassava", "Castor", "Cauliflower", "Celery",
  "Chamomile", "Cherry", "Chestnut", "Chia", "Chickpea",
  "Chili Pepper", "Chive", "Cinnamon", "Clove", "Coconut",
  "Coffee", "Common Bean", "Coriander", "Corn", "Cotton",
  "Cowpea", "Cranberry", "Cucumber", "Cumin", "Curry Leaf",
  "Custard Apple", "Date Palm", "Dill", "Dragonfruit", "Drumstick (Moringa)",
  "Durian", "Eggplant", "Fava Bean", "Fennel", "Fenugreek",
  "Fig", "Finger Millet", "Flax", "Foxtail Millet", "Galangal",
  "Garlic", "Ginger", "Gooseberry", "Grape", "Groundnut",
  "Guava", "Hazelnut", "Hemp", "Horse Gram", "Hyacinth Bean",
  "Jackfruit", "Jute", "Kenaf", "Kidney Bean", "Kodo Millet",
  "Kohlrabi", "Lavender", "Leek", "Lemon Grass", "Lentil",
  "Lettuce", "Lima Bean", "Longan", "Loquat", "Lotus",
  "Luffa Gourd", "Lychee", "Macadamia Nut", "Maize", "Malabar Spinach",
  "Mango", "Mangosteen", "Marjoram", "Millet", "Mint",
  "Moringa", "Moth Bean", "Mulberry", "Mung Bean", "Mushroom",
  "Muskmelon", "Mustard", "Nutmeg", "Oats", "Oil Palm",
  "Okra", "Olive", "Onion", "Orange", "Oregano",
  "Papaya", "Passion Fruit", "Pea", "Peach", "Pear",
  "Pearl Millet", "Pecan", "Persimmon", "Pigeon Pea", "Pineapple",
  "Pistachio", "Plantain", "Plum", "Pomegranate", "Pomelo",
  "Potato", "Proso Millet", "Pumpkin", "Quinoa", "Radish",
  "Rambutan", "Raspberry", "Rice", "Rice Bean", "Ridge Gourd",
  "Roselle", "Rosemary", "Rubber", "Rye", "Safflower",
  "Saffron", "Sage", "Sesame", "Shallot", "Sisal",
  "Snake Gourd", "Sorghum", "Soursop", "Soybean", "Spelt",
  "Spinach", "Stevia", "Strawberry", "Sugar Beet", "Sugarcane",
  "Sunflower", "Sunn Hemp", "Sweet Potato", "Sweet Sorghum", "Tamarind",
  "Taro", "Tea", "Teff", "Thyme", "Tomato",
  "Triticale", "Turmeric", "Turnip", "Vanilla", "Velvet Bean",
  "Walnut", "Watermelon", "Wax Gourd", "Wheat", "Winged Bean",
  "Yam", "Yam Bean", "Zucchini"
];

// LatLng type remains useful
type LatLng = {
  lat: number;
  lng: number;
};

type ResolvedAddress = {
  displayAddress: string;
  city: string;
  pincode: string;
};

type RecommendationApiResponse = {
  recommendations: Array<{
    crop_name: string;
    crop_info: string;
    expected_yield?: {
      in_tons_per_acre: number;
    };
    diseases?: Array<{
      name: string;
      symptoms: string;
      treatment: string;
    }>;
    image_url?: string;
  }>;
  processing_time_seconds: number;
  source?: string;
};

// Area units remain the same
const AREA_UNITS = [
  { value: "sqm", label: "Square meters" },
  { value: "hectares", label: "Hectare" },
  { value: "acres", label: "Acre" },
  { value: "bigha", label: "Bigha" }
];

// --- Google Maps Configuration ---
const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.375rem', // Corresponds to rounded-md
  border: '1px solid #d1d5db', // Corresponds to border-gray-300
};

// Libraries needed for Google Maps API (geocoding for address lookup)
const libraries: ("places" | "geocoding" | "drawing" | "geometry" | "visualization")[] = ['geocoding', 'places'];
const FALLBACK_CROPS = ["Wheat", "Rice", "Maize", "Millet", "Soybean", "Chickpea", "Groundnut", "Sugarcane"];

const Recommendation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { user } = useAuth();

  const DEFAULT_POSITION: LatLng = { lat: 19.99675137006276, lng: 73.78974342339409 };

  // --- Remove Leaflet Refs ---
  // const mapRef = useRef<HTMLDivElement | null>(null); // No longer needed for div ref
  // const mapInstance = useRef<L.Map | null>(null);
  // const markerInstance = useRef<L.Marker | null>(null);

  // --- Google Maps State ---
  const mapRef = useRef<google.maps.Map | null>(null); // Ref to store map instance

  // State for map location and address details
  const [markerPosition, setMarkerPosition] = useState<LatLng>(DEFAULT_POSITION);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  
  // state for the "Save Profile" checkbox
  const [shouldUpdateProfile, setShouldUpdateProfile] = useState(false);

  // Add state to hold the rich user profile data from your service
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Form state (remains the same)
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    farmArea: "",
    areaUnit: AREA_UNITS[0].value,
  });

  // Add a new useEffect to fetch the full user profile from your service
  useEffect(() => {
    // We only fetch the profile if the user is authenticated
    if (user) {
      const fetchProfileData = async () => {
        try {
          const profile = await getUserProfile();
          if (profile) {
            setUserProfile(profile);
          }
        } catch (error) {
          console.error("Failed to fetch user profile on recommendation page:", error);
          // Optional: You could show a non-blocking toast here if needed
        }
      };
      fetchProfileData();
    }
  }, [user]); // This effect runs when the auth state is confirmed

  // Add a useEffect to pre-fill the form when the user data is available
  useEffect(() => {
    // This effect now depends on both the basic auth user and the fetched profile
    if (user) {
      // Prioritize the name from the editable profile, but fall back to the auth name
      const nameToSet = userProfile?.displayName || user.displayName || '';
      
      // The contact number can now be correctly fetched from our custom profile data
      const contactToSet = userProfile?.contactNumber || '';

      // Update the form data state
      setFormData(currentData => ({
        ...currentData,
        name: nameToSet,
        contact: contactToSet,
      }));
    }
  }, [user, userProfile]); // This effect runs when auth state is confirmed OR when the full profile is fetched


  // Crop state (remains the same)
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [availableCrops, setAvailableCrops] = useState<string[]>(CROP_OPTIONS);

  // Error state (remains the same)
  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});

  const saveFarmDraftLocally = useCallback(() => {
    const draft = {
      username: formData.name,
      area: formData.farmArea,
      measureScale: formData.areaUnit,
      previousCrops: selectedCrops,
      address,
      city,
      pincode,
      contactNum: formData.contact,
      markerPosition,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem("earthbloom:lastFarmDraft", JSON.stringify(draft));
    return draft;
  }, [address, city, formData.areaUnit, formData.contact, formData.farmArea, formData.name, markerPosition, pincode, selectedCrops]);

  const buildFallbackRecommendations = useCallback((mergedData: {
    avg_temperature: number;
    min_temperature: number;
    total_rainfall: number;
    avg_humidity: number;
    avg_wind_speed: number;
    elevation: number;
    soil_ph: number;
    soil_nitrogen: number;
    soil_phosphorus: number;
    soil_potassium: number;
    historical_crops: string[];
  }): RecommendationApiResponse => {
    const cropProfiles = [
      { name: "Rice", temp: [24, 34], rainfall: [120, 400], ph: [5.0, 7.0], humidityMin: 65, elevationMax: 1800, nutrients: [90, 40, 40] },
      { name: "Sugarcane", temp: [21, 35], rainfall: [75, 250], ph: [6.0, 8.0], humidityMin: 55, elevationMax: 1600, nutrients: [120, 50, 50] },
      { name: "Maize", temp: [18, 32], rainfall: [40, 180], ph: [5.8, 7.8], humidityMin: 45, elevationMax: 2600, nutrients: [90, 40, 35] },
      { name: "Wheat", temp: [10, 25], rainfall: [20, 100], ph: [6.0, 7.8], humidityMin: 35, elevationMax: 3000, nutrients: [80, 35, 30] },
      { name: "Millet", temp: [20, 34], rainfall: [15, 90], ph: [5.5, 7.5], humidityMin: 30, elevationMax: 2400, nutrients: [45, 20, 20] },
      { name: "Chickpea", temp: [15, 29], rainfall: [15, 80], ph: [6.0, 8.0], humidityMin: 30, elevationMax: 2200, nutrients: [30, 20, 20] },
      { name: "Groundnut", temp: [20, 32], rainfall: [30, 140], ph: [5.8, 7.2], humidityMin: 40, elevationMax: 1700, nutrients: [35, 20, 25] },
      { name: "Soybean", temp: [20, 30], rainfall: [45, 160], ph: [6.0, 7.5], humidityMin: 45, elevationMax: 1800, nutrients: [40, 25, 25] },
      { name: "Cotton", temp: [21, 35], rainfall: [35, 120], ph: [5.8, 8.0], humidityMin: 35, elevationMax: 1200, nutrients: [70, 30, 35] },
      { name: "Barley", temp: [12, 25], rainfall: [20, 90], ph: [6.0, 8.0], humidityMin: 30, elevationMax: 3000, nutrients: [55, 25, 25] },
      { name: "Mustard", temp: [12, 28], rainfall: [20, 100], ph: [5.5, 7.8], humidityMin: 30, elevationMax: 2500, nutrients: [60, 30, 30] },
      { name: "Potato", temp: [12, 24], rainfall: [30, 120], ph: [5.0, 6.8], humidityMin: 40, elevationMax: 3000, nutrients: [100, 45, 60] },
    ] as const;

    const previousCrops = new Set(mergedData.historical_crops.map(crop => crop.toLowerCase()));

    const ranked = cropProfiles
      .filter((crop) => !previousCrops.has(crop.name.toLowerCase()))
      .map((crop) => {
        let score = 0;

        const tempMid = (crop.temp[0] + crop.temp[1]) / 2;
        const rainfallMid = (crop.rainfall[0] + crop.rainfall[1]) / 2;
        const phMid = (crop.ph[0] + crop.ph[1]) / 2;

        score += Math.max(0, 30 - Math.abs(mergedData.avg_temperature - tempMid) * 3);
        score += Math.max(0, 18 - Math.abs(mergedData.total_rainfall - rainfallMid) / 6);
        score += Math.max(0, 16 - Math.abs(mergedData.soil_ph - phMid) * 10);
        score += mergedData.avg_humidity >= crop.humidityMin ? 8 : Math.max(0, 8 - (crop.humidityMin - mergedData.avg_humidity) / 4);
        score += mergedData.elevation <= crop.elevationMax ? 8 : Math.max(0, 8 - (mergedData.elevation - crop.elevationMax) / 300);
        score += Math.max(0, 8 - Math.max(0, mergedData.avg_wind_speed - 18));
        score += Math.max(0, 12 - Math.abs(mergedData.soil_nitrogen - crop.nutrients[0]) / 12);
        score += Math.max(0, 10 - Math.abs(mergedData.soil_phosphorus - crop.nutrients[1]) / 8);
        score += Math.max(0, 10 - Math.abs(mergedData.soil_potassium - crop.nutrients[2]) / 10);
        score += mergedData.min_temperature >= crop.temp[0] - 3 ? 4 : 0;

        return { crop, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const chosen = (ranked.length ? ranked : cropProfiles.slice(0, 3).map((crop, index) => ({ crop, score: 60 - index * 5 })));

    return {
      recommendations: chosen.map(({ crop, score }, index) => ({
        crop_name: crop.name,
        crop_info: `${crop.name} matches your fallback analysis using local weather, soil pH, NPK pattern, elevation, and crop history. Suitability score: ${score.toFixed(1)}.`,
        expected_yield: {
          in_tons_per_acre: Number((Math.max(1.2, Math.min(4.8, 1.4 + score / 35 - index * 0.15))).toFixed(1)),
        },
        diseases: [
          {
            name: "Field monitoring recommended",
            symptoms: "Watch for yellowing leaves, fungal spots, stunted growth, or chewing pests after germination.",
            treatment: "Use crop rotation, inspect weekly, maintain drainage, and apply locally appropriate controls when symptoms appear.",
          },
        ],
      })),
      processing_time_seconds: 0,
      source: "local-fallback",
    };
  }, []);

  const getSoilMeanValue = (layers: any[], propName: string): number | null => {
    const layer = layers.find((l: any) => l.name === propName);
    const depths = Array.isArray(layer?.depths) ? layer.depths : [];

    for (const depth of depths) {
      const mean = depth?.values?.mean;
      if (typeof mean === "number") {
        return mean;
      }
    }

    return null;
  };

  // --- Load Google Maps Script ---
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "", // Access env variable
    libraries: libraries,
  });

  // --- Geocoding Functions ---

  const applyResolvedAddress = useCallback((resolved: ResolvedAddress) => {
    setAddress(resolved.displayAddress);
    setCity(resolved.city);
    setPincode(resolved.pincode);

    if (
      resolved.displayAddress !== "Address not found" &&
      resolved.displayAddress !== "Error fetching address" &&
      errors.location
    ) {
      setErrors(currentErrors => ({ ...currentErrors, location: undefined }));
    }
  }, [errors.location]);

  const parseNominatimAddress = (result: any): ResolvedAddress => {
    const addressDetails = result?.address ?? {};

    return {
      displayAddress: result?.display_name || "Address not found",
      city:
        addressDetails.city ||
        addressDetails.town ||
        addressDetails.village ||
        addressDetails.hamlet ||
        addressDetails.county ||
        addressDetails.state_district ||
        addressDetails.state ||
        "Unknown",
      pincode: addressDetails.postcode || "",
    };
  };

  const reverseGeocodeWithNominatim = useCallback(async (lat: number, lng: number): Promise<ResolvedAddress> => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Fallback reverse geocoding failed (${response.status})`);
    }

    const data = await response.json();
    return parseNominatimAddress(data);
  }, []);

  const searchLocationWithNominatim = useCallback(async (query: string) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Fallback location search failed (${response.status})`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const firstResult = data[0];
    return {
      position: {
        lat: Number(firstResult.lat),
        lng: Number(firstResult.lon),
      },
      address: parseNominatimAddress(firstResult),
    };
  }, []);


  // Function to fetch address from coordinates using Nominatim
  const getAddressFromCoordinates = useCallback(async (lat: number, lng: number) => {
    if (!isLoaded) return;

    setIsLoadingAddress(true);

    try {
      const fallbackAddress = await reverseGeocodeWithNominatim(lat, lng);
      applyResolvedAddress(fallbackAddress);
    } catch (fallbackError: any) {
      console.error("Error fetching address via fallback geocoder:", fallbackError);
      setAddress("Error fetching address");
      setCity("");
      setPincode("");
      toast({ title: "Geocoding Error", description: `Could not fetch address: ${fallbackError?.message || 'Unknown error'}`, variant: "destructive" });
    } finally {
      setIsLoadingAddress(false);
    }
  }, [isLoaded, applyResolvedAddress, reverseGeocodeWithNominatim, toast]);


  // Function to get current location (remains mostly the same, but updates map differently)
  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoadingAddress(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPosition = { lat: latitude, lng: longitude };

          setMarkerPosition(newPosition); // Update state triggers re-render

          // Pan the map to the new location if map is loaded
          if (mapRef.current) {
            mapRef.current.panTo(newPosition);
            mapRef.current.setZoom(14); // Zoom in a bit more
          }
          // Fetch address (will be called by useEffect watching markerPosition)
          // getAddressFromCoordinates(latitude, longitude); // No need to call directly, useEffect handles it
        },
        (error) => {
          console.error("Error fetching current location:", error);
          setIsLoadingAddress(false);
          toast({
            title: "Location Error",
            description: "Could not fetch current location. Please enable location services.",
            variant: "destructive"
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive"
      });
    }
  };

  // Function to update marker position by searching an address
  const updateMarkerFromAddress = async (addressQuery: string) => {
    if (!addressQuery.trim() || !isLoaded) return;

    setIsLoadingAddress(true);

    try {
      let newPosition: LatLng | null = null;
      let resolvedAddress: ResolvedAddress | null = null;

      const fallbackResult = await searchLocationWithNominatim(addressQuery);

      if (fallbackResult) {
        newPosition = fallbackResult.position;
        resolvedAddress = fallbackResult.address;
      }

      if (newPosition) {
        setMarkerPosition(newPosition); // Update state triggers re-render

        if (resolvedAddress) {
          applyResolvedAddress(resolvedAddress);
        }

        if (mapRef.current) {
          mapRef.current.panTo(newPosition);
          mapRef.current.setZoom(14);
        }

        setSearchAddress(''); // Clear search input
      } else {
        toast({
          title: "Address Not Found",
          description: `No location found for "${addressQuery}"`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error fetching location from search providers:", error);
      toast({
        title: "Search Error",
        description: `Error searching for address: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsLoadingAddress(false);
    }
  };


  // --- useEffect for Initial Address Fetch & when MarkerPosition changes ---
  useEffect(() => {
    // Fetch address whenever markerPosition changes, but only if the API is loaded
    if (isLoaded) {
      getAddressFromCoordinates(markerPosition.lat, markerPosition.lng);
    }
    // No cleanup needed here for Google Maps components themselves
  }, [markerPosition, isLoaded, getAddressFromCoordinates]); // Add getAddressFromCoordinates dependency


  // --- Map Event Handlers ---
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map; // Store map instance
    // Optionally set initial bounds or other map options here
  }, []);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setMarkerPosition({
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      });
    }
  }, []);

  const onMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setMarkerPosition({
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      });
    }
  }, []);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null; // Clean up map instance ref
  }, []);


  // --- Form Handling (handleCropSelection, handleRemoveCrop, handleInputChange, handleSelectChange) ---
  // These remain exactly the same as before.
  // ... (copy the existing functions here) ...
  const handleCropSelection = (crop: string) => {
    if (selectedCrops.length >= 3) {
      toast({
        title: "Maximum crops selected",
        description: "You can only select up to 3 past crops",
        variant: "destructive"
      });
      return;
    }

    if (!crop) return; // Prevent adding empty string

    setSelectedCrops([...selectedCrops, crop]);
    setAvailableCrops(availableCrops.filter(c => c !== crop));

    // Clear validation error for pastCrops if present
    if (errors.pastCrops) {
      setErrors(currentErrors => {
        const newErrors = { ...currentErrors };
        delete newErrors.pastCrops;
        return newErrors;
      });
    }
  };

  const handleRemoveCrop = (crop: string) => {
    setSelectedCrops(selectedCrops.filter(c => c !== crop));
    setAvailableCrops([...availableCrops, crop].sort());
  };

  // Handle input changes for text/number fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error for this field
    if (errors[name]) {
      setErrors(currentErrors => {
        const newErrors = { ...currentErrors };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });

    // Clear error for this field if applicable (e.g., areaUnit)
    if (errors[name]) {
      setErrors(currentErrors => {
        const newErrors = { ...currentErrors };
        delete newErrors[name];
        return newErrors;
      });
    }
  };


  // --- Validation (validateForm) ---
  // Remains the same.
  // ... (copy the existing function here) ...
  const validateForm = () => {
    let currentErrors: { [key: string]: string | undefined } = {};
    let isValid = true;

    if (!formData.name.trim()) {
      currentErrors.name = "Name is required.";
      isValid = false;
    }

    if (!formData.farmArea.trim() || isNaN(parseFloat(formData.farmArea)) || parseFloat(formData.farmArea) <= 0) {
      currentErrors.farmArea = "Enter a valid area size.";
      isValid = false;
    }

    const phonePattern = /^[1-9]\d{9}$/; // Simple 10-digit number starting 1-9
    if (!formData.contact.trim() || !phonePattern.test(formData.contact)) {
      currentErrors.contact = "Enter a valid 10-digit contact number.";
      isValid = false;
    }

    // Check if address was successfully determined
    if (!address.trim() || !city.trim() || city === 'Unknown' || !pincode.trim() || address === 'Address not found' || address === 'Error fetching address') {
      currentErrors.location = "Valid location with address, city, and pincode required. Please select on map or search.";
      // isValid = false; // Keep validation, but maybe allow submission if only pincode is missing sometimes? Decide on strictness. For now, require all.
      isValid = false;
    }


    // Must select exactly 3 past crops
    if (selectedCrops.length !== 3) {
      currentErrors.pastCrops = "Please select exactly 3 past crops.";
      isValid = false;
    }


    setErrors(currentErrors);
    return isValid;
  };


  // --- Data Fetching Helper (fetchSoilData) ---
  // Remains the same.
  // ... (copy the existing function here) ...
  const fetchSoilData = async (lat: number, lng: number) => {
    let maxAttempts = 5;
    let offset = 0.005; // Start with a small offset

    for (let i = 0; i < maxAttempts; i++) {
      // Vary coordinates slightly to find a covered tile
      let currentLat = lat + (i % 2 === 0 ? offset : -offset);
      let currentLng = lng + (i % 2 === 0 ? (i < 2 ? 0 : offset) : (i < 2 ? 0 : -offset)); // Alternate lat/lng adjustments

      if (i > 1) offset += 0.005; // Increase offset after first couple attempts

      try {
        console.log(`Attempt ${i + 1}: Fetching soil data at lat=${currentLat.toFixed(6)}, lng=${currentLng.toFixed(6)}`);
        const soilApi = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${currentLng}&lat=${currentLat}&properties=phh2o,nitrogen,soc,cec,wv0010,potassium_extractable&depth=0-5cm`;
        const soilResponse = await axios.get(soilApi, { timeout: 15000 }); // Increased timeout

        console.log("Soil API Response Status:", soilResponse.status);

        const layers = soilResponse.data?.properties?.layers;
        if (soilResponse.status === 200 && layers && layers.length > 0) {
          let hasValidData = false;
          for (const layer of layers) {
            if (layer.depths?.length > 0 && layer.depths[0].values.mean !== null) {
              hasValidData = true;
              break;
            }
          }

          if (hasValidData) {
            console.log("✅ Soil Data Found:", soilResponse.data.properties);
            return soilResponse;
          } else {
            console.warn(`⚠️ Attempt ${i + 1}: Soil data available but mean values are null for depth 0-5cm. Trying nearby...`);
          }
        } else {
          console.warn(`⚠️ Attempt ${i + 1}: Soil API returned success but data structure is unexpected or empty.`);
        }

      } catch (error: any) {
        console.error(`❌ Error Fetching Soil Data (Attempt ${i + 1}):`, error.message);
        if (axios.isAxiosError(error) && error.response) {
          console.error("Error Response Data:", error.response.data);
          console.error("Error Response Status:", error.response.status);
          if (error.response.status === 400 || error.response.status === 404) {
            console.warn(`⚠️ Coordinates out of bounds or not covered by SoilGrids. Trying nearby...`);
          } else if (error.response.status >= 500) {
            console.warn(`⚠️ Soil API server error. Trying nearby...`);
          } else {
            console.error("Non-recoverable API error.");
          }
        } else if (axios.isAxiosError(error) && error.request) {
          console.error("No response received from Soil API. Request details:", error.request);
          console.warn(`⚠️ Soil API request failed (network or timeout). Trying nearby...`);
        } else {
          console.error("Error setting up Soil API request:", error.message);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 700));
    }

    console.error("❌ Soil data could not be fetched after multiple attempts.");
    return null;
  };


  // --- Submission Handling (handleSubmit) ---
  // Remains mostly the same, just ensure it uses the correct state variables (address, city, pincode, markerPosition)
  // ... (copy the existing function here, double-check variable names match state) ...
  const fetchSoilDataRobust = async (lat: number, lng: number) => {
    const soilResponse = await fetchSoilData(lat, lng);
    const layers = soilResponse?.data?.properties?.layers;

    if (!Array.isArray(layers) || layers.length === 0) {
      return null;
    }

    const hasUsableData = ["phh2o", "nitrogen", "soc", "cec", "wv0010", "potassium_extractable"]
      .some((propName) => getSoilMeanValue(layers, propName) !== null);

    return hasUsableData ? soilResponse : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission

    if (!validateForm()) {
      Swal.fire({
        title: "Validation Error",
        text: "Please fill all required fields correctly.",
        icon: "error",
      });
      toast({
        title: "Validation Failed",
        description: "Please check the highlighted fields.",
        variant: "destructive"
      });
      return;
    }

    // Show confirmation pop-up using Swal
    const confirmationResult = await Swal.fire({
      title: "Confirm Submission?",
      text: "Submit your farm details to get recommendations?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6", // Blue
      cancelButtonColor: "#d33", // Red
      confirmButtonText: "Yes, Submit!",
    });

    if (!confirmationResult.isConfirmed) {
      return; // Stop if user cancels
    }

    // --- Start Submission Process ---
    Swal.fire({
      title: "Processing Your Request",
      html: `
        <div style="text-align: left; padding: 10px;">
          <p id="swal-step1">1. Saving farm details...</p>
          <p id="swal-step2" style="color: grey;">2. Fetching soil data...</p>
          <p id="swal-step3" style="color: grey;">3. Fetching weather data...</p>
          <p id="swal-step4" style="color: grey;">4. Fetching elevation data...</p>
          <p id="swal-step5" style="color: grey;">5. Generating recommendations...</p>
        </div>
      `,
      icon: "info",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading(); // Show spinner
      },
      showConfirmButton: false, // Hide the default OK button
    });

    // Helper to update Swal step
    const updateSwalStep = (stepNumber: number, status: 'processing' | 'done' | 'warning' | 'error', text?: string) => {
      const stepElement = Swal.getHtmlContainer()?.querySelector(`#swal-step${stepNumber}`) as HTMLElement | null; // Cast needed
      if (stepElement) {
        stepElement.textContent = `${stepNumber}. ${text || stepElement.textContent?.substring(3)}`; // Update text if provided
        if (status === 'done') stepElement.innerHTML = `✅ ${stepElement.textContent}`;
        else if (status === 'warning') stepElement.innerHTML = `⚠️ ${stepElement.textContent}`;
        else if (status === 'error') stepElement.innerHTML = `❌ ${stepElement.textContent}`;
        else {
          stepElement.style.color = 'black'; // Reset color for processing
        }
      }
      const nextStepElement = Swal.getHtmlContainer()?.querySelector(`#swal-step${stepNumber + 1}`) as HTMLElement | null; // Cast needed
      if (nextStepElement && status === 'done') {
        nextStepElement.style.color = 'black'; // Make next step active
      }
    };


    try {
      // Step 1: Save farm details locally so this step always completes in-browser
      updateSwalStep(1, 'processing', 'Saving farm details locally...');
      const savedDraft = saveFarmDraftLocally();
      console.log("Saved farm draft locally:", savedDraft);
      updateSwalStep(1, 'done', 'Farm details saved locally.');

      // Step 2: Fetch Soil Data
      updateSwalStep(2, 'processing');
      let soilResponse = await fetchSoilDataRobust(markerPosition.lat, markerPosition.lng);
      let soilFetchStatus: 'done' | 'warning' | 'error' = 'done';

      // Process soil data
      const soilDataForModel = {
        soil_ph: 7.0, // Defaults in case of failure
        soil_nitrogen: 100,
        soil_phosphorus: 100,
        soil_potassium: 150,
        soil_moisture: 20,
        soil_cec: 20,
        raw_soil_data: null as any // Keep raw response for result page if needed
      };

      if (soilResponse && soilResponse.data && soilResponse.data.properties && soilResponse.data.properties.layers) {
        soilDataForModel.raw_soil_data = soilResponse.data.properties; // Store properties
        const layers = soilResponse.data.properties.layers;
        soilDataForModel.soil_ph = (getSoilMeanValue(layers, "phh2o") ?? 70) / 10;
        soilDataForModel.soil_nitrogen = getSoilMeanValue(layers, "nitrogen") ?? 100;
        soilDataForModel.soil_phosphorus = getSoilMeanValue(layers, "soc") ?? 100; // Using SOC as proxy
        soilDataForModel.soil_potassium = getSoilMeanValue(layers, "potassium_extractable") ?? 150;
        soilDataForModel.soil_moisture = (getSoilMeanValue(layers, "wv0010") ?? 200) / 10; // Check units
        soilDataForModel.soil_cec = (getSoilMeanValue(layers, "cec") ?? 200) / 10; // Check units

        console.log("Processed Soil Data:", soilDataForModel);
        updateSwalStep(2, 'done');
      } else {
        console.warn("Soil data service unavailable, using baseline defaults.");
        soilFetchStatus = 'warning';
        updateSwalStep(2, 'done', 'Soil baseline prepared.');
        // Defaults are already set
      }


      // Step 3: Fetch Weather Data
      updateSwalStep(3, 'processing');
      const weatherApi = `https://api.open-meteo.com/v1/forecast?latitude=${markerPosition.lat}&longitude=${markerPosition.lng}&hourly=relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&forecast_days=16`;
      const weatherResponse = await axios.get(weatherApi);
      const weatherDataDaily = weatherResponse.data.daily;
      const weatherDataHourly = weatherResponse.data.hourly;
      updateSwalStep(3, 'done');


      // Step 4: Fetch Elevation Data
      updateSwalStep(4, 'processing');
      const elevationApi = `https://api.open-meteo.com/v1/elevation?latitude=${markerPosition.lat}&longitude=${markerPosition.lng}`;
      const elevationRes = await axios.get(elevationApi);
      const elevation = elevationRes.data.elevation?.[0] ?? 500; // Default elevation
      updateSwalStep(4, 'done');


      // Process Weather Data for Model
      const safeReduce = (arr: number[] | undefined, initial: number = 0) => arr?.reduce((sum, val) => sum + (val ?? 0), initial) ?? initial;
      const safeMin = (arr: number[] | undefined, defaultVal: number) => arr && arr.length > 0 ? Math.min(...arr.filter(v => v !== null) as number[]) : defaultVal;
      const safeAvg = (arr: number[] | undefined, defaultVal: number) => {
        const validItems = arr?.filter(v => v !== null) as number[] | undefined;
        return validItems && validItems.length > 0 ? safeReduce(validItems) / validItems.length : defaultVal;
      };

      const avgHourlyHumidity = safeAvg(weatherDataHourly?.relative_humidity_2m, 60);
      const minHourlyHumidity = safeMin(weatherDataHourly?.relative_humidity_2m, 40);
      const avgDailyTemp = safeAvg(weatherDataDaily?.temperature_2m_max, 25);
      const minDailyTemp = safeMin(weatherDataDaily?.temperature_2m_min, 15);
      const avgWindSpeed = safeAvg(weatherDataDaily?.wind_speed_10m_max, 10);
      const totalRainfall = safeReduce(weatherDataDaily?.precipitation_sum);


      // Step 5: Merge Data for Recommendation API
      updateSwalStep(5, 'processing');
      const mergedData = {
        latitude: markerPosition.lat,
        longitude: markerPosition.lng,
        elevation: Math.round(elevation),
        soil_ph: parseFloat(soilDataForModel.soil_ph.toFixed(1)),
        soil_nitrogen: Math.round(soilDataForModel.soil_nitrogen),
        soil_phosphorus: Math.round(soilDataForModel.soil_phosphorus),
        soil_potassium: Math.round(soilDataForModel.soil_potassium),
        soil_moisture: Math.round(soilDataForModel.soil_moisture),
        soil_cec: Math.round(soilDataForModel.soil_cec),
        avg_temperature: parseFloat(avgDailyTemp.toFixed(1)),
        min_temperature: parseFloat(minDailyTemp.toFixed(1)),
        avg_humidity: parseFloat(avgHourlyHumidity.toFixed(1)),
        min_humidity: parseFloat(minHourlyHumidity.toFixed(1)),
        avg_wind_speed: parseFloat(avgWindSpeed.toFixed(1)),
        total_rainfall: parseFloat(totalRainfall.toFixed(1)),
        historical_crops: selectedCrops,
      };

      console.log("Merged Data for Recommendation:", mergedData);

      // Step 6: Send Merged Data to Recommendation API
      const backendUrl = "https://crop-recommendation-fastapi.onrender.com/recommend";
      console.log(`Sending data to backend: ${backendUrl}`);

      let recommendationPayload: RecommendationApiResponse;

      try {
        const recommendationResponse = await axios.post(backendUrl, mergedData, { timeout: 90000 });

        if (recommendationResponse.status !== 200 && recommendationResponse.status !== 201) {
          throw new Error("Failed to get recommendation data from API.");
        }

        recommendationPayload = recommendationResponse.data;
      } catch (recommendationError: any) {
        console.error("Recommendation API unavailable, using local fallback recommendations:", recommendationError);
        recommendationPayload = buildFallbackRecommendations(mergedData);
        toast({
          title: "Using fallback recommendations",
          description: "The recommendation server did not respond, so the app generated a local backup result.",
          variant: "destructive",
        });
      }

      updateSwalStep(5, 'done');

      console.log("Recommendation Response:", recommendationPayload);

      // Prepare data for Results page
      const soilDataForResultsPage = {
        ph: mergedData.soil_ph,
        nitrogen: mergedData.soil_nitrogen,
        phosphorus: mergedData.soil_phosphorus,
        potassium: mergedData.soil_potassium,
        cec: mergedData.soil_cec,
        moisture: mergedData.soil_moisture,
        texture: "N/A",
        organic: null,
        soilRecommendations: ["Review nutrient levels based on recommended crops."],
        // raw_soil_properties: soilDataForModel.raw_soil_data // Optionally pass raw data
      };

      if (shouldUpdateProfile) {
        // Prepare the data to be saved.
        // We merge the existing profile with the new form data to avoid
        // accidentally deleting fields that aren't on this form (like photoURL).
        const profileDataToSave: UserProfile = {
          ...userProfile, // Spread existing profile data first
          displayName: formData.name,
          contactNumber: formData.contact,
        };
        
        console.log("Saving updated profile data:", profileDataToSave);
        try {
          await saveUserProfile(profileDataToSave);
          toast({ title: "Profile details saved." });
        } catch (profileSaveError: any) {
          console.error("Profile save failed after recommendation generation:", profileSaveError);
          toast({
            title: "Recommendation ready",
            description: "Your results were generated, but profile details could not be saved with the current Firebase permissions.",
            variant: "destructive",
          });
        }
      }



      // Final Success Message
      Swal.fire({
        title: "Success!",
        text: "Recommendations generated successfully.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        // Step 7: Navigate to result page
        navigate("/results", {
          state: {
            recommendations: recommendationPayload,
            weather: weatherResponse.data,
            soil: soilDataForResultsPage,
            location: city || address.split(',')[0] || "Selected Location",
          }
        });
      });


    } catch (error: any) {
      console.error("Error during submission process:", error);
      Swal.close(); // Close loading Swal

      let errorMessage = "An unexpected error occurred during submission.";
      let errorDetails = "";

      if (axios.isAxiosError(error)) {
        errorDetails = error.message;
        if (error.response) {
          errorMessage = `API Error (${error.response.status})`;
          errorDetails = error.response.data?.detail || JSON.stringify(error.response.data) || error.message;
          errorMessage += `: ${errorDetails.substring(0, 100)}${errorDetails.length > 100 ? '...' : ''}`;
        } else if (error.request) {
          errorMessage = "Network Error";
          errorDetails = "Could not reach one or more data services. Please check your connection and try again.";
        } else {
          errorMessage = "Request Setup Error";
          errorDetails = error.message;
        }
      } else {
        errorMessage = "Processing Error";
        errorDetails = error.message;
      }


      Swal.fire("Submission Failed", `${errorMessage}. ${errorDetails}`, "error");
      toast({
        title: errorMessage,
        description: errorDetails.substring(0, 150) + (errorDetails.length > 150 ? '...' : ''),
        variant: "destructive",
        duration: 7000
      });
    }
  };


  // --- Render Logic ---
  if (loadError) {
    return (
      <Layout>
        <section className="py-12 bg-farm-cream">
          <div className="container text-center text-red-600">
            Error loading Google Maps. Please check your API key setup and network connection. <br />
            Error details: {loadError.message}
          </div>
        </section>
      </Layout>
    );
  }


  return (
    <Layout>
      <section className="py-12 bg-farm-cream">
        <div className="container">
          <div className="text-center mb-12">
            {/* ... */}
          </div>

          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                {/* ... */}
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-6 border p-4 rounded-md">
                    <legend className="text-lg font-semibold px-2">Contact Details</legend>
                    <div className="space-y-2">
                      <Label htmlFor="name">Name<span className="text-red-500">*</span></Label>
                      <Input
                        id="name" name="name" placeholder="Your full name"
                        value={formData.name} // This value is now controlled by the state
                        onChange={handleInputChange} required
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact">Contact Number<span className="text-red-500">*</span></Label>
                      <Input
                        id="contact" name="contact" placeholder="10-digit mobile number"
                        value={formData.contact}
                        onChange={handleInputChange} required
                        type="tel" maxLength={10} pattern="[1-9]{1}[0-9]{9}"
                        className={errors.contact ? "border-red-500" : ""}
                      />
                      {errors.contact && <p className="text-red-500 text-sm">{errors.contact}</p>}
                    </div>

                    {/* Add the Checkbox UI to the form --- */}
                     <div className="flex items-center space-x-2 md:col-span-2 mt-2">
                        <Checkbox
                          id="update-profile"
                          checked={shouldUpdateProfile}
                          onCheckedChange={(checked) => setShouldUpdateProfile(Boolean(checked))}
                        />
                        <Label htmlFor="update-profile" className="text-sm font-normal cursor-pointer">
                          Save these details to my profile for next time.
                        </Label>
                      </div>


                  </fieldset>

                  {/* --- Location Details (uses Google Map) --- */}
                  <fieldset className="space-y-4 border p-4 rounded-md">
                    <legend className="text-lg font-semibold px-2">Farm Location<span className="text-red-500">*</span></legend>
                    {/* Address Search (remains the same) */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        type="text" placeholder="Search address or place name..."
                        value={searchAddress} onChange={(e) => setSearchAddress(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); updateMarkerFromAddress(searchAddress); } }}
                        disabled={isLoadingAddress || !isLoaded} // Disable if map not loaded
                        className="flex-grow"
                      />
                      <Button type="button" onClick={() => updateMarkerFromAddress(searchAddress)} disabled={isLoadingAddress || !searchAddress.trim() || !isLoaded} className="w-full sm:w-auto">
                        {isLoadingAddress && searchAddress ? 'Searching...' : 'Search'}
                      </Button>
                      <Button type="button" onClick={useCurrentLocation} variant="outline"
                        disabled={isLoadingAddress || !isLoaded} // Disable if map not loaded
                        className="w-full sm:w-auto"
                      >
                        {isLoadingAddress && !searchAddress ? 'Fetching...' : <><BiCurrentLocation className="mr-1" /> Use Current</>}
                      </Button>
                    </div>
                    {errors.location && <p className="text-red-500 text-sm -mt-2 mb-2">{errors.location}</p>}

                    {/* Google Map Container */}
                    <div className="relative"> {/* Added relative positioning for loading overlay */}
                      {!isLoaded ? (
                        <div style={mapContainerStyle} className="flex items-center justify-center bg-gray-200 text-gray-600">
                          Loading Map...
                        </div>
                      ) : (
                        <GoogleMap
                          mapContainerStyle={mapContainerStyle}
                          center={markerPosition} // Center map on marker position
                          zoom={13}
                          onLoad={onMapLoad}
                          onUnmount={onMapUnmount}
                          onClick={onMapClick}
                          options={{ // Optional: Disable some controls if desired
                            streetViewControl: false,
                            mapTypeControl: false,
                            fullscreenControl: false,
                          }}
                        >
                          <MarkerF
                            position={markerPosition}
                            draggable={true}
                            onDragEnd={onMarkerDragEnd}
                          />
                        </GoogleMap>
                      )}
                      {/* Loading Overlay for Address Fetch */}
                      {isLoadingAddress && isLoaded && (
                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 pointer-events-none">
                          <p className="text-gray-700 font-semibold bg-white/80 px-4 py-2 rounded shadow">Loading location data...</p>
                        </div>
                      )}
                    </div>


                    {/* Displayed Location Info (remains the same) */}
                    <div className="space-y-1 text-sm text-gray-700 bg-gray-50 p-3 rounded-md border">
                      <p><strong>Selected Coordinates:</strong> {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}</p>
                      <p><strong>Address:</strong> {isLoadingAddress && !address ? <span className="italic">Fetching...</span> : (address || <span className="italic text-gray-500">Click on map or search</span>)}</p>
                      <p><strong>City/Town:</strong> {city || '-'}</p>
                      <p><strong>Pincode:</strong> {pincode || '-'}</p>
                    </div>
                  </fieldset>

                  {/* --- Farm & Crop Details (remains the same) --- */}
                  <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-6 border p-4 rounded-md">
                    <legend className="text-lg font-semibold px-2">Farm & Crop History</legend>
                    {/* Farm Area and Unit */}
                    <div className="space-y-2">
                      <Label htmlFor="farmArea">Farm Area<span className="text-red-500">*</span></Label>
                      <div className="flex gap-2">
                        <Input
                          id="farmArea" name="farmArea" type="number" placeholder="Area size"
                          value={formData.farmArea} onChange={handleInputChange} required min="0" step="any"
                          className={`flex-grow ${errors.farmArea ? "border-red-500" : ""}`}
                        />
                        <Select value={formData.areaUnit} onValueChange={(value) => handleSelectChange("areaUnit", value)}>
                          <SelectTrigger id="areaUnit" className="w-[150px]">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {AREA_UNITS.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {errors.farmArea && <p className="text-red-500 text-sm">{errors.farmArea}</p>}
                    </div>
                    {/* Past Crops Selection */}
                    <div className="space-y-3 md:col-span-2">
                      <Label>3 Past Crops<span className="text-red-500">*</span></Label>
                      <p className="text-xs text-gray-500 -mt-2">Select exactly 3 crops previously grown here.</p>
                      <div className="flex flex-wrap gap-2 mb-3 min-h-[30px] p-2 border rounded-md bg-gray-50">
                        {selectedCrops.length === 0 && <span className="text-sm text-gray-400 italic">No crops selected</span>}
                        {selectedCrops.map((crop) => (
                          <div key={crop} className="flex items-center bg-farm-secondary/20 text-farm-primary px-3 py-1 rounded-full text-sm whitespace-nowrap">
                            {crop}
                            <button type="button" className="ml-2 text-farm-primary/70 hover:text-red-600 focus:outline-none" onClick={() => handleRemoveCrop(crop)} aria-label={`Remove ${crop}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <Select disabled={selectedCrops.length >= 3} onValueChange={(value) => value && handleCropSelection(value)} value="">
                        <SelectTrigger id="pastCrops" className={errors.pastCrops ? "border-red-500" : ""}>
                          <SelectValue placeholder={selectedCrops.length >= 3 ? "Maximum 3 crops selected" : "Add a past crop..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCrops.map((crop) => (<SelectItem key={crop} value={crop}>{crop}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      {errors.pastCrops && <p className="text-red-500 text-sm">{errors.pastCrops}</p>}
                    </div>
                  </fieldset>

                  {/* Submit button */}
                  <Button
                    type="submit"
                    className="w-full bg-farm-primary hover:bg-farm-dark text-lg py-3"
                    size="lg"
                    disabled={isLoadingAddress || !isLoaded} // Also disable if map is not loaded
                  >
                    {!isLoaded ? 'Map Loading...' : isLoadingAddress ? 'Finalizing Location...' : 'Generate Recommendations'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Recommendation;
