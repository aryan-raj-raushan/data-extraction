export interface School {
  _id: string;
  serial_no?: number;
  udise_code?: string;
  school_name: string;
  state: string;
  district: string;
  block?: string;
  village?: string;
  cluster?: string;
  location?: string;
  state_mgmt?: string;
  national_mgmt?: string;
  school_category?: string;
  school_type?: string;
  school_status?: string;
}
