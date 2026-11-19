import { hotelClient } from "./httpclient/hotel.client";

interface payload {
 hotelName: string;
 ownerName: string;
 contactNumber: string;
 hotelLocation: string;
 propertyType: string;
 checkinTime: string;
 checkoutTime: string;
 hotelDescription: string;
 facilities: string[];
 esewa_Merchantid: string | undefined;
 khalti_SecretKey: string | undefined;
}

export const registerHotel = (data: FormData) => {
  return hotelClient
    .post("/register", data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then(res => res.data);
};

export const getHotelInfo=()=>{return hotelClient.get('/my-hotel').then(res=>res.data); }

export const getHotelById = (hotelId: string) => {
  return hotelClient.get(`/${hotelId}?t=${new Date().getTime()}`).then(res => res.data);
};

export const createRoom = (hotelId: string, data: FormData) => {
  return hotelClient
    .post(`/room/${hotelId}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then(res => res.data);
};

export const getRooms = (hotelId: string, page = 1, limit = 12) => {
  return hotelClient
    .get(`/rooms/${hotelId}`, {
      params: { page, limit },
    })
    .then(res => res.data);
};

export const getHotelDashboard = () => {
  return hotelClient.get("/dashboard").then(res => res.data);
};

export const getBookingHistory = (hotelId: string) => {
    return hotelClient.get(`/booking-history/${hotelId}`)
}

export const getHotelRatings = (hotelId: string) => {
    return hotelClient.get(`/ratings/${hotelId}`)
}

export const updateHotelInfo = (hotelId: string, data: payload) => {
    return hotelClient.post(`/update-hotel-info/${hotelId}`, data 
      ).then(res => res.data);
}

export const updateHotelGallery = (hotelId: string, data: FormData) => {
  return hotelClient
    .post(`/update-hotel-gallery/${hotelId}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then(res => res.data);
};

export const deleteHotelGalleryImage = (hotelId: string, imageUrl: string) => {
  return hotelClient
    .delete(`/delete-hotel-gallery-image/${hotelId}`, {
      data: { imageUrl }
    })
    .then(res => res.data);
};

export const updateRoomInfo = (roomId: string, data: any) => {
  return hotelClient.post(`/update-room-info/${roomId}`, data)
    .then(res => res.data);
}

export const updateRoomImages = (roomId: string, data: FormData) => {
  return hotelClient
    .post(`/update-room-images/${roomId}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then(res => res.data);
}

export const deleteRoom=(roomId:string)=>{
  return hotelClient.delete(`room/${roomId}`).then(res=>res.data);
}

export const deleteRoomImage = (roomId: string, imageUrl: string) => {
  return hotelClient
    .delete(`/roomImage/${roomId}`, {
      data: { imageUrl }
    })
    .then(res => res.data);
};