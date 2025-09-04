import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from collections import defaultdict
from datetime import date, datetime, timedelta

# ----------------- Setup ----------------- #
app = FastAPI(title="Hospital SOC Dashboard API")

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to the data folder
BASE_PATH = Path(__file__).parent / "data"

# ----------------- Utility ----------------- #
def read_json(filename: str) -> List[Dict[str, Any]]:
    """Reads a JSON file from the data directory."""
    filepath = BASE_PATH / filename
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail=f"Required data file not found: {filename}")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail=f"Could not parse data from file: {filename}. The file might be corrupted.")

# Load all JSON data from files
HOSPITALS = read_json("hospitals.json")
METRICS = read_json("hospital_metrics.json")
CERTIFICATIONS = read_json("hospital_certifications.json")
ADDRESSES = read_json("hospital_addresses.json")
WARDS_ROOMS = read_json("wards_rooms.json")
ICU_FACILITIES = read_json("icu_facilities.json")
DOCTORS = read_json("doctors.json")
MEDICAL_SPECIALTIES = read_json("medical_specialties.json")
DOCUMENT_UPLOADS = read_json("document_uploads.json") # New data loaded here

# Create maps for efficient data retrieval
ADDRESSES_MAP = {addr.get("hospital_id"): addr for addr in ADDRESSES}
WARDS_MAP = defaultdict(list)
for item in WARDS_ROOMS:
    WARDS_MAP[item['hospital_id']].append(item)
ICU_MAP = defaultdict(list)
for item in ICU_FACILITIES:
    ICU_MAP[item['hospital_id']].append(item)
HOSPITALS_MAP = {h.get("id"): h for h in HOSPITALS}

def calculate_network_averages(metrics: List[Dict[str, Any]]):
    """Calculates network averages for key metrics."""
    network_averages = {
        "total_doctors": 0,
        "qualified_nurses": 0,
        "doctor_bed_ratio": 0,
        "nurse_bed_ratio": 0,
        "icu_doctor_bed_ratio": 0,
        "icu_nurse_bed_ratio": 0,
        "beds_operational": 0
    }
    metric_keys = list(network_averages.keys())
    
    counts = {key: 0 for key in metric_keys}
    sums = {key: 0 for key in metric_keys}

    for m in metrics:
        for key in metric_keys:
            value = m.get(key)
            if value is not None:
                sums[key] += value
                counts[key] += 1
    
    for key in metric_keys:
        if counts[key] > 0:
            network_averages[key] = round(sums[key] / counts[key], 2)
    
    total_beds_sum = sum(h.get("beds_operational", 0) for h in HOSPITALS)
    total_hospitals_with_beds = sum(1 for h in HOSPITALS if h.get("beds_operational") is not None)
    if total_hospitals_with_beds > 0:
        network_averages["beds_operational"] = round(total_beds_sum / total_hospitals_with_beds, 2)

    return network_averages

NETWORK_AVERAGES = calculate_network_averages(METRICS)

def get_positioning_data(hospital_id: int) -> Optional[Dict[str, Any]]:
    """Helper function to get positioning data for a single hospital."""
    hospital = next((h for h in HOSPITALS if h["id"] == hospital_id), None)
    if not hospital:
        return None

    hospital_metrics = next((m for m in METRICS if m["hospital_id"] == hospital_id), {})
    hospital_certifications = [c for c in CERTIFICATIONS if c["hospital_id"] == hospital_id]
    hospital_address = ADDRESSES_MAP.get(hospital_id, {})

    selected_hospital_values = {
        "total_doctors": hospital_metrics.get("total_doctors"),
        "qualified_nurses": hospital_metrics.get("qualified_nurses"),
        "doctor_bed_ratio": hospital_metrics.get("doctor_bed_ratio"),
        "nurse_bed_ratio": hospital_metrics.get("nurse_bed_ratio"),
        "icu_doctor_bed_ratio": hospital_metrics.get("icu_doctor_bed_ratio"),
        "icu_nurse_bed_ratio": hospital_metrics.get("icu_nurse_bed_ratio"),
        "beds_operational": hospital.get("beds_operational")
    }

    relative_positioning_percent = {}
    for key, value in selected_hospital_values.items():
        if value is not None and NETWORK_AVERAGES.get(key) not in (0, None):
            relative_positioning_percent[key] = round((value / NETWORK_AVERAGES[key]) * 100, 2)
        else:
            relative_positioning_percent[key] = None

    return {
        "hospital_name": hospital.get("name"),
        "hospital_id": hospital_id,
        "city": hospital_address.get("city_town"),
        "state": hospital_address.get("state"),
        "district": hospital_address.get("district"),
        "metrics": {
            "network_averages": NETWORK_AVERAGES,
            "selected_hospital_values": selected_hospital_values,
            "relative_positioning_percent": relative_positioning_percent
        },
        "certifications": hospital_certifications
    }

# ----------------- Merged Endpoint Logic ----------------- #
def get_all_hospital_details() -> List[Dict[str, Any]]:
    hospitals_data = read_json("hospitals.json")
    addresses_data = read_json("hospital_addresses.json")
    
    contacts_data = read_json("hospital_contacts.json")
    specialties_data = read_json("medical_specialties.json")

    addresses_map = {addr.get("hospital_id"): addr for addr in addresses_data}
    contacts_map = defaultdict(list)
    for contact in contacts_data:
        hosp_id = contact.get("hospital_id")
        if hosp_id:
            contacts_map[hosp_id].append(contact)

    specialties_map = defaultdict(list)
    for specialty in specialties_data:
        hosp_id = specialty.get("hospital_id")
        if hosp_id:
            specialties_map[hosp_id].append(specialty)

    merged_hospitals = []
    for hospital in hospitals_data:
        hosp_id = hospital.get("id")
        if not hosp_id:
            continue
        
        merged_hospital = {
            **hospital,
            "address": addresses_map.get(hosp_id, {}),
            "contacts": contacts_map.get(hosp_id, []),
            "specialties": specialties_map.get(hosp_id, []),
        }
        merged_hospitals.append(merged_hospital)

    return merged_hospitals

def count_doctors_per_hospital():
    """Counts the total number of doctors for each hospital."""
    doctor_counts = defaultdict(int)
    for doctor in DOCTORS:
        if doctor['hospital_id'] in doctor_counts:
            doctor_counts[doctor['hospital_id']] += 1
        else:
            doctor_counts[doctor['hospital_id']] = 1
    return doctor_counts

def calculate_document_status() -> List[Dict[str, Any]]:
    """Calculates the document verification status for each hospital."""
    # Group documents by hospital ID and count verified vs. unverified
    hospital_docs_status = defaultdict(lambda: {"total": 0, "verified": 0, "unverified": 0})
    for doc in DOCUMENT_UPLOADS:
        hospital_id = doc.get("entity_id")
        if hospital_id:
            hospital_docs_status[hospital_id]["total"] += 1
            if doc.get("is_verified"):
                hospital_docs_status[hospital_id]["verified"] += 1
            else:
                hospital_docs_status[hospital_id]["unverified"] += 1
    
    # Format the data for the API response
    status_list = []
    for hospital_id, status_counts in hospital_docs_status.items():
        hospital_info = HOSPITALS_MAP.get(hospital_id, {})
        if not hospital_info:
            continue # Skip if no matching hospital is found

        total = status_counts["total"]
        verified = status_counts["verified"]
        unverified = status_counts["unverified"]
        
        # Determine the overall verification status
        verification_status = "Unverified"
        if verified > 0 and unverified == 0:
            verification_status = "Verified"
        elif verified > 0:
            verification_status = "Partially Verified"
        
        status_list.append({
            "hospital_id": hospital_id,
            "hospital_name": hospital_info.get("name"),
            "total_documents": total,
            "verified_documents": verified,
            "unverified_documents": unverified,
            "verification_status": verification_status,
        })
    return status_list

@app.get("/hospitals/full-profile", response_model=List[Dict[str, Any]], tags=["Hospitals"])
def get_all_hospitals_full_profile():
    data = get_all_hospital_details()
    return data

# New endpoint to get a summary of hospitals and their doctor counts
@app.get("/api/hospital-doctors-summary", tags=["Directory"])
def get_hospitals_with_doctor_count():
    doctor_counts = count_doctors_per_hospital()
    summary = []
    for hospital in HOSPITALS:
        hospital_id = hospital["id"]
        hospital_address = ADDRESSES_MAP.get(hospital_id, {})
        summary.append({
            "id": hospital_id,
            "name": hospital["name"],
            "address": hospital_address,
            "total_doctors": doctor_counts.get(hospital_id, 0)
        })
    return summary

# Existing endpoint to get detailed doctors for a specific hospital
@app.get("/api/doctors/{hospital_id}", tags=["Directory"])
def get_doctors_by_hospital(hospital_id: int):
    """
    Endpoint to get doctors and their specialties for a selected hospital.
    It joins doctors.json and medical_specialties.json data.
    """
    # Create a dictionary for quick specialty lookup
    specialties_map = {
        item['id']: item['specialty_name']
        for item in MEDICAL_SPECIALTIES
    }

    # Filter doctors by the selected hospital ID
    filtered_doctors = [
        doctor
        for doctor in DOCTORS
        if doctor['hospital_id'] == hospital_id
    ]

    # Join doctors with specialty names
    doctors_with_specialty = []
    for doctor in filtered_doctors:
        specialty_name = specialties_map.get(doctor.get('specialty_id'))
        if specialty_name:
            doctors_with_specialty.append({
                "id": doctor["id"],
                "name": doctor["name"],
                "designation": doctor["designation"],
                "specialty_name": specialty_name,
                "qualification": doctor["qualification"],
                "experience_years": doctor["experience_years"],
                "consultation_type": doctor["consultation_type"]
            })

    return doctors_with_specialty

@app.get("/api/specialty_coverage_matrix")
async def get_specialty_coverage_matrix():
    """
    Calculates and returns a matrix of specialty availability by city.
    """
    try:
        specialties_data = read_json("medical_specialties.json")
        addresses_data = read_json("hospital_addresses.json")
        
        # Create mappings for quick lookups
        hospital_id_to_city = {
            addr["hospital_id"]: addr["city_town"]
            for addr in addresses_data
            if addr.get("address_type") == "Primary"
        }
        
        # Get all unique cities and specialties
        all_cities = sorted(list(set(hospital_id_to_city.values())))
        all_specialties = sorted(list(set(s["specialty_name"] for s in specialties_data)))

        # Build the coverage data structure
        coverage_map = defaultdict(lambda: defaultdict(bool))
        for specialty_record in specialties_data:
            hospital_id = specialty_record["hospital_id"]
            specialty_name = specialty_record["specialty_name"]
            
            city = hospital_id_to_city.get(hospital_id)
            
            if city and specialty_record.get("is_available"):
                coverage_map[city][specialty_name] = True
        
        # Create the final matrix
        matrix = []
        for city in all_cities:
            row = {
                "city": city,
                "coverage": {}
            }
            for specialty in all_specialties:
                is_available = coverage_map.get(city, {}).get(specialty, False)
                row["coverage"][specialty] = is_available
            matrix.append(row)

        return {
            "cities": all_cities,
            "specialties": all_specialties,
            "matrix_data": matrix
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/hospitals/document-status", tags=["Documents"])
def get_hospital_document_status():
    """
    Provides a summary of document verification status for all hospitals.
    Counts verified vs. unverified documents for each hospital.
    """
    return calculate_document_status()
# ------------- New Endpoint for Geographic Coverage ------------- #

def get_geographic_data() -> List[Dict[str, Any]]:
    """Loads and prepares geographic data for all hospitals."""
    hospitals_data = read_json("hospitals.json")
    addresses_data = read_json("hospital_addresses.json")

    addresses_map = {addr.get("hospital_id"): addr for addr in addresses_data}
    
    geographic_data = []
    for hospital in hospitals_data:
        hospital_id = hospital.get('id')
        address = addresses_map.get(hospital_id, {})
        
        # Merge data and add a fixed service radius
        geographic_entry = {
            "id": hospital_id,
            "name": hospital.get('name'),
            "latitude": hospital.get('latitude'),
            "longitude": hospital.get('longitude'),
            "address": address,
            "service_radius_km": 25 # Default service radius
        }
        geographic_data.append(geographic_entry)
        
    return geographic_data

@app.get("/hospitals/geographic-coverage", response_model=List[Dict[str, Any]], tags=["Hospitals"])
def get_geographic_coverage():
    """Returns geographic data for all hospitals, including service radius."""
    data = get_geographic_data()
    return data

# ------------- New Endpoints for ICU Capacity Network Analysis ------------- #

def get_icu_summary_data():
    total_icu_beds = 0
    total_available_icu_beds = 0
    total_ventilators = 0
    total_monitors = 0
    total_icu_doctor_bed_ratio = 0
    hospital_count = 0

    for hospital in HOSPITALS:
        hospital_id = hospital['id']
        wards_for_hospital = WARDS_MAP.get(hospital_id, [])
        icu_beds_from_wards = sum(item['total_beds'] for item in wards_for_hospital if item['ward_type'] == 'ICU')
        available_icu_beds_from_wards = sum(item['available_beds'] for item in wards_for_hospital if item['ward_type'] == 'ICU')
        
        total_icu_beds += icu_beds_from_wards
        total_available_icu_beds += available_icu_beds_from_wards
        
        icu_data_for_hospital = ICU_MAP.get(hospital_id, [])
        total_ventilators += sum(d['ventilators'] for d in icu_data_for_hospital)
        total_monitors += sum(d['monitors'] for d in icu_data_for_hospital)

        metrics_for_hospital = next((m for m in METRICS if m['hospital_id'] == hospital_id), None)
        if metrics_for_hospital and 'icu_doctor_bed_ratio' in metrics_for_hospital:
            total_icu_doctor_bed_ratio += metrics_for_hospital['icu_doctor_bed_ratio']
            hospital_count += 1
            
    utilization_rate = (total_icu_beds - total_available_icu_beds) / total_icu_beds if total_icu_beds > 0 else 0
    avg_icu_doctor_bed_ratio = total_icu_doctor_bed_ratio / hospital_count if hospital_count > 0 else 0
    
    return {
        'total_icu_beds': total_icu_beds,
        'total_available_icu_beds': total_available_icu_beds,
        'utilization_rate': round(utilization_rate, 2),
        'total_ventilators': total_ventilators,
        'total_monitors': total_monitors,
        'avg_icu_doctor_bed_ratio': round(avg_icu_doctor_bed_ratio, 2)
    }

@app.get("/api/icu-capacity/summary", tags=["ICU Capacity"])
def icu_summary():
    """Returns a network-wide summary of ICU bed capacity and utilization."""
    return get_icu_summary_data()

@app.get("/api/icu-capacity/hospitals", tags=["ICU Capacity"])
def icu_hospitals():
    """Returns detailed ICU capacity metrics for each hospital."""
    hospitals_list = []
    
    for hospital in HOSPITALS:
        hospital_id = hospital['id']
        hospital_info = hospital
        address_info = ADDRESSES_MAP.get(hospital_id, {})
        
        wards_for_hospital = WARDS_MAP.get(hospital_id, [])
        icu_beds_from_wards = sum(item['total_beds'] for item in wards_for_hospital if item['ward_type'] == 'ICU')
        available_beds_from_wards = sum(item['available_beds'] for item in wards_for_hospital if item['ward_type'] == 'ICU')
        
        utilization_rate = (icu_beds_from_wards - available_beds_from_wards) / icu_beds_from_wards if icu_beds_from_wards > 0 else 0
        
        icu_facilities_list = ICU_MAP.get(hospital_id, [])
        metrics_for_hospital = next((m for m in METRICS if m['hospital_id'] == hospital_id), {})
        
        hospital_details = {
            'hospital_id': hospital_id,
            'name': hospital_info.get('name', 'N/A'),
            'address': address_info.get('street', 'N/A'),
            'city': address_info.get('city_town', 'N/A'),
            'total_icu_beds': icu_beds_from_wards,
            'available_icu_beds': available_beds_from_wards,
            'icu_utilization': round(utilization_rate, 2),
            'icu_facilities': icu_facilities_list,
            'metrics': metrics_for_hospital
        }
        hospitals_list.append(hospital_details)
        
    return hospitals_list

# ----------------- New Endpoint for Quality Score Calculation ----------------- #

def get_quality_scores() -> List[Dict[str, Any]]:
    """
    Calculates and returns a list of hospitals with their quality scores.
    The score is based on certifications, doctor ratio, and nurse ratio.
    """
    # Create maps for efficient lookup
    metrics_map = {m['hospital_id']: m for m in METRICS}
    cert_counts = defaultdict(int)
    for c in CERTIFICATIONS:
        cert_counts[c['hospital_id']] += 1

    hospitals_with_data = []
    for h in HOSPITALS:
        hospital_id = h.get('id')
        metrics = metrics_map.get(hospital_id)
        certifications = cert_counts.get(hospital_id, 0)
        address = ADDRESSES_MAP.get(hospital_id, {})

        if metrics:
            hospitals_with_data.append({
                "hospital_id": hospital_id,
                "name": h.get('name'),
                "city": address.get('city_town'),
                "certifications": certifications,
                "doctorRatio": metrics.get('doctor_bed_ratio', 0),
                "nurseRatio": metrics.get('nurse_bed_ratio', 0),
            })

    # Find max values for normalization to a 0-100 scale
    max_certs = max(h['certifications'] for h in hospitals_with_data) if hospitals_with_data else 0
    max_doctor_ratio = max(h['doctorRatio'] for h in hospitals_with_data) if hospitals_with_data else 0
    max_nurse_ratio = max(h['nurseRatio'] for h in hospitals_with_data) if hospitals_with_data else 0
    
    scored_hospitals = []
    for h in hospitals_with_data:
        normalized_cert_score = (h['certifications'] / max_certs) if max_certs > 0 else 0
        normalized_doctor_score = (h['doctorRatio'] / max_doctor_ratio) if max_doctor_ratio > 0 else 0
        normalized_nurse_score = (h['nurseRatio'] / max_nurse_ratio) if max_nurse_ratio > 0 else 0

        # Calculate the final score based on weights
        final_score = (normalized_cert_score * 40) + (normalized_doctor_score * 30) + (normalized_nurse_score * 30)

        scored_hospitals.append({
            "hospital_id": h['hospital_id'],
            "name": h['name'],
            "city": h['city'],
            "certifications": h['certifications'],
            "doctorRatio": h['doctorRatio'],
            "nurseRatio": h['nurseRatio'],
            "qualityScore": round(final_score),
        })

    # Sort hospitals by quality score in descending order
    scored_hospitals.sort(key=lambda x: x['qualityScore'], reverse=True)
    
    return scored_hospitals

@app.get("/hospitals/quality-scores", response_model=List[Dict[str, Any]], tags=["Hospitals"])
def get_hospitals_quality_scores():
    """Returns a list of all hospitals with a calculated quality score and ranking."""
    data = get_quality_scores()
    return data

# ----------------- New Endpoint for Hospital Size Classification ----------------- #
def classify_hospitals_by_size() -> Dict[str, Any]:
    hospitals = read_json("hospitals.json")
    classifications = {
        "Small": 0,
        "Medium": 0,
        "Large": 0,
    }
    
    for hospital in hospitals:
        bed_count = hospital.get("beds_operational") or hospital.get("beds_registered")
        if bed_count is None or not isinstance(bed_count, int):
            continue
        if bed_count < 100:
            classifications["Small"] += 1
        elif 100 <= bed_count <= 300:
            classifications["Medium"] += 1
        else:
            classifications["Large"] += 1

    total_hospitals = len(hospitals)
    if total_hospitals == 0:
        return {"distribution": [], "total_hospitals": 0}

    pie_chart_data = [
        {"name": "Small (<100 beds)", "value": classifications["Small"]},
        {"name": "Medium (100-300 beds)", "value": classifications["Medium"]},
        {"name": "Large (>300 beds)", "value": classifications["Large"]},
    ]

    return {
        "distribution": pie_chart_data,
        "total_hospitals": total_hospitals
    }

@app.get("/hospitals/size-distribution", response_model=Dict[str, Any], tags=["Hospitals"])
def get_hospital_size_distribution():
    data = classify_hospitals_by_size()
    return data

# ----------------- Hospital Positioning Endpoints ----------------- #
@app.get("/hospitals/{hospital_id}/positioning", response_model=Dict[str, Any], tags=["Hospitals", "Metrics"])
def get_hospital_positioning(hospital_id: int):
    """
    Calculates and returns a selected hospital's key metrics
    relative to the network averages.
    """
    data = get_positioning_data(hospital_id)
    if not data:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return data

@app.get("/hospitals/positioning/all", tags=["Hospitals"])
def get_all_hospital_positioning():
    """
    Returns the positioning report for all hospitals in the network.
    """
    all_hospitals_data = [get_positioning_data(h["id"]) for h in HOSPITALS]
    return [data for data in all_hospitals_data if data is not None]

# ----------------- Existing Endpoints (retained and corrected) ----------------- #
def get_merged_metrics_data() -> List[Dict[str, Any]]:
    metrics_data = read_json("hospital_metrics.json")
    addresses_data = read_json("hospital_addresses.json")
    hospitals_data = read_json("hospitals.json")
    addresses_dict = {addr.get("hospital_id"): addr for addr in addresses_data if addr.get("hospital_id")}
    hospitals_dict = {hosp.get("id"): hosp for hosp in hospitals_data if hosp.get("id")}
    merged_list = []
    for metric in metrics_data:
        hosp_id = metric.get("hospital_id")
        if hosp_id is None:
            continue
        address = addresses_dict.get(hosp_id, {})
        hospital = hospitals_dict.get(hosp_id, {})
        merged_list.append({
            "hospital_id": hosp_id,
            "hospital_name": hospital.get("name", "Unknown"),
            "total_doctors": metric.get("total_doctors"),
            "total_beds": hospital.get("beds_operational", 0),
            "doctor_bed_ratio": metric.get("doctor_bed_ratio"),
            "city": address.get("city_town", None),
            "district": address.get("district", None),
            "state": address.get("state", None),
        })
    merged_list.sort(key=lambda x: x["doctor_bed_ratio"] if x["doctor_bed_ratio"] is not None else -1, reverse=True)
    for i, item in enumerate(merged_list, 1):
        item["rank"] = i
    return merged_list

def get_equipment_data():
    hospitals_data = read_json("hospitals.json")
    addresses_data = read_json("hospital_addresses.json")
    equipment_data = read_json("hospital_equipment.json")
    addresses_map = {addr.get("hospital_id"): addr for addr in addresses_data if addr.get("hospital_id")}
    equipment_map = defaultdict(lambda: defaultdict(int))
    for item in equipment_data:
        hospital_id = item.get("hospital_id")
        equipment_name = item.get("equipment_name")
        quantity = item.get("quantity", 0)
        if hospital_id is not None and equipment_name is not None:
            equipment_map[hospital_id][equipment_name] += quantity
    all_equipment_types = sorted(list(set(item.get("equipment_name") for item in equipment_data if item.get("equipment_name"))))
    merged_data = []
    for hospital in hospitals_data:
        hospital_id = hospital.get("id")
        if hospital_id is None:
            continue
        hospital_equipment = equipment_map.get(hospital_id, {})
        hospital_address = addresses_map.get(hospital_id, {})
        equipment_status = {
            eq_type: hospital_equipment.get(eq_type, 0)
        for eq_type in all_equipment_types
        }
        merged_data.append({
            "id": hospital_id,
            "name": hospital.get("name", "Unknown"),
            "city": hospital_address.get("city_town", "Unknown"),
            "state": hospital_address.get("state", "Unknown"),
            "equipment": equipment_status
        })
    return {
        "data": merged_data,
        "equipmentTypes": all_equipment_types
    }

@app.get("/metrics/doctor-to-bed-ratio", response_model=Dict[str, Any], tags=["Metrics"])
def merged_doctor_to_bed_ratio():
    data = get_merged_metrics_data()
    return {"data": data}

@app.get("/equipment-data", response_model=Dict[str, Any], tags=["Equipment"])
def equipment_data():
    data = get_equipment_data()
    return data
    
def calculate_doctor_bed_ratio():
    hospitals_data = read_json("hospitals.json")
    doctors_data = read_json("doctors.json")
    merged = []
    for h in hospitals_data:
        hosp_id = h.get("id")
        if hosp_id is None:
            continue
        beds = h.get("beds_operational") or h.get("beds_registered") or 0
        total_doctors = sum(1 for d in doctors_data if d.get("hospital_id") == hosp_id)
        ratio = round(total_doctors / beds, 2) if beds > 0 else None
        merged.append({
            "hospital_id": hosp_id,
            "hospital_name": h.get("name", "Unknown"),
            "total_doctors": total_doctors,
            "total_beds": beds,
            "doctor_bed_ratio": ratio
        })
    return merged

@app.get("/doctor-to-bed-ratio", response_model=Dict[str, Any], tags=["Original"])
def doctor_to_bed_ratio():
    data = calculate_doctor_bed_ratio()
    return {"data": data}

@app.get("/hospitals", response_model=List[Dict[str, Any]], tags=["Hospitals"])
def get_all_hospitals():
    return read_json("hospitals.json")

@app.get("/hospital_addresses", response_model=List[Dict[str, Any]], tags=["Hospitals"])
def get_hospital_addresses():
    return read_json("hospital_addresses.json")

@app.get("/hospitals/basic", response_model=List[Dict[str, Any]], tags=["Hospitals"])
def get_hospitals_basic():
    hospitals = read_json("hospitals.json")
    addresses = read_json("hospital_addresses.json")
    address_map = {addr.get("hospital_id"): addr for addr in addresses if addr.get("hospital_id")}
    result = []
    for hosp in hospitals:
        addr = address_map.get(hosp.get("id"), {})
        result.append({
            "id": hosp.get("id"),
            "name": hosp.get("name", "Unknown"),
            "type": hosp.get("hospital_type", "Unknown"),
            "beds": hosp.get("beds_operational", 0),
            "beds_registered": hosp.get("beds_registered", 0),
            "city": addr.get("city_town", "Unknown"),
            "state": addr.get("state", "Unknown"),
        })
    return result

@app.get("/hospitals/contacts", response_model=List[Dict[str, Any]], tags=["Hospitals"])
def get_hospital_contacts():
    contacts = read_json("hospital_contacts.json")
    hospitals = read_json("hospitals.json")
    addresses = read_json("hospital_addresses.json")
    hospital_map = {h.get("id"): h for h in hospitals}
    address_map = {a.get("hospital_id"): a for a in addresses}
    result = []
    for c in contacts:
        hosp = hospital_map.get(c.get("hospital_id"), {})
        addr = address_map.get(c.get("hospital_id"), {})
        result.append({
            "hospital_id": c.get("hospital_id"),
            "hospital_name": hosp.get("name", "Unknown"),
            "city": addr.get("city_town", "Unknown"),
            "state": addr.get("state", "Unknown"),
            "contact_type": c.get("contact_type", ""),
            "person_name": c.get("person_name", ""),
            "designation": c.get("designation", ""),
            "phone": c.get("phone", ""),
            "mobile": c.get("mobile", ""),
            "email": c.get("email", ""),
            "department": c.get("department", ""),
            "is_primary": c.get("is_primary", False),
        })
    return result

@app.get("/hospitals/specialties", response_model=List[Dict[str, Any]], tags=["Hospitals"])
def get_hospital_specialties():
    specialties = read_json("medical_specialties.json")
    hospitals = read_json("hospitals.json")
    addresses = read_json("hospital_addresses.json")
    hosp_map = {h.get("id"): h for h in hospitals}
    addr_map = {a.get("hospital_id"): a for a in addresses}
    result = defaultdict(lambda: {"specialties": []})
    for spec in specialties:
        hosp_id = spec.get("hospital_id")
        if hosp_id is None:
            continue
        hosp = hosp_map.get(hosp_id, {})
        addr = addr_map.get(hosp_id, {})
        if "hospital_id" not in result[hosp_id]:
            result[hosp_id].update({
                "hospital_id": hosp_id,
                "hospital_name": hosp.get("name", "Unknown"),
                "city": addr.get("city_town", "Unknown"),
                "state": addr.get("state", "Unknown"),
            })
        result[hosp_id]["specialties"].append({
            "specialty_name": spec.get("specialty_name", ""),
            "specialty_category": spec.get("specialty_category", ""),
            "is_available": spec.get("is_available", False),
            "established_year": spec.get("established_year", None),
        })
    return list(result.values())

@app.get("/hospital/profile/{hospital_id}", response_model=Dict[str, Any], tags=["Hospitals"])
def get_hospital_profile(hospital_id: int):
    hospitals = read_json("hospitals.json")
    addresses = read_json("hospital_addresses.json")
    contacts = read_json("hospital_contacts.json")
    specialties = read_json("medical_specialties.json")
    hospital = next((h for h in hospitals if h.get("id") == hospital_id), None)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    address = next((a for a in addresses if a.get("hospital_id") == hospital_id), None)
    hosp_contacts = [c for c in contacts if c.get("hospital_id") == hospital_id]
    hosp_specialties = [s for s in specialties if s.get("hospital_id") == hospital_id]
    return {
        "id": hospital.get("id"),
        "name": hospital.get("name", "Unknown"),
        "type": hospital.get("hospital_type", "Unknown"),
        "beds_operational": hospital.get("beds_operational", 0),
        "beds_registered": hospital.get("beds_registered", 0),
        "address": address,
        "contacts": hosp_contacts,
        "specialties": hosp_specialties
    }
    
# ----------------- Analytics Endpoint ----------------- #
@app.get("/analytics/summary", tags=["Analytics"])
def get_analytics_summary():
    """
    Provides a high-level summary of key metrics for the network.
    """
    hospitals = read_json("hospitals.json")
    metrics = read_json("hospital_metrics.json")
    doctors = read_json("doctors.json")

    total_hospitals = len(hospitals)
    total_beds = sum(h.get("beds_operational", 0) for h in hospitals)
    total_doctors = len(doctors)
    
    total_ratio_sum = sum(m.get("doctor_bed_ratio", 0) for m in metrics)
    valid_ratios_count = sum(1 for m in metrics if m.get("doctor_bed_ratio") is not None)
    
    avg_doctor_bed_ratio = round(total_ratio_sum / valid_ratios_count, 2) if valid_ratios_count > 0 else 0

    return {
        "total_hospitals": total_hospitals,
        "total_beds_operational": total_beds,
        "total_doctors": total_doctors,
        "average_doctor_to_bed_ratio": avg_doctor_bed_ratio
    }
    
# ----------------- New Endpoint for Hospital Location and Accessibility ----------------- #
def get_hospital_locations() -> List[Dict[str, Any]]:
    """
    Processes the hospital addresses data to return a list of primary addresses.
    This function acts as the service layer for the new endpoint.
    """
    addresses_data = read_json("hospital_addresses.json")
    
    # Filter for "Primary" addresses as they represent the main hospital location
    primary_addresses = [addr for addr in addresses_data if addr.get("address_type") == "Primary" and addr.get("is_active") == True]
    
    # Format the addresses for the frontend
    formatted_locations = []
    for addr in primary_addresses:
        full_address = (
            f"{addr.get('street', '')}, "
            f"{addr.get('area_locality', '')}, "
            f"{addr.get('city_town', '')}, "
            f"{addr.get('district', '')}, "
            f"{addr.get('state', '')} - "
            f"{addr.get('pin_code', '')}"
        ).replace('\n', ', ').strip()
        
        formatted_locations.append({
            "hospital_id": addr.get("hospital_id"),
            "full_address": full_address,
            "address_details": {
                "street": addr.get("street", ""),
                "area_locality": addr.get("area_locality", ""),
                "city_town": addr.get("city_town", ""),
                "district": addr.get("district", ""),
                "state": addr.get("state", ""),
                "pin_code": addr.get("pin_code", ""),
                "nearest_landmark": addr.get("nearest_landmark", "")
            }
        })
        
    return formatted_locations

@app.get("/hospitals/locations", response_model=List[Dict[str, Any]], tags=["Hospitals"])
def get_hospital_locations_endpoint():
    """
    Endpoint to get location and address details for all hospitals.
    """
    return get_hospital_locations()
    
# ----------------- New Combined Endpoint for Dashboard Cards ----------------- #
def get_hospitals_for_dashboard() -> List[Dict[str, Any]]:
    """
    Combines hospital names and primary addresses for the dashboard view.
    """
    hospitals_data = read_json("hospitals.json")
    addresses_data = read_json("hospital_addresses.json")
    
    addresses_map = {addr.get("hospital_id"): addr for addr in addresses_data if addr.get("address_type") == "Primary"}
    
    combined_data = []
    for hospital in hospitals_data:
        hospital_id = hospital.get("id")
        address = addresses_map.get(hospital_id)
        
        if address:
            full_address = (
                f"{address.get('street', '')}, "
                f"{address.get('area_locality', '')}, "
                f"{address.get('city_town', '')}, "
                f"{address.get('state', '')} - "
                f"{address.get('pin_code', '')}"
            ).replace('\n', ', ').strip()
            
            combined_data.append({
                "hospital_id": hospital_id,
                "name": hospital.get("name", "Unknown Hospital"),
                "full_address": full_address,
                "address_details": address
            })
            
    return combined_data

@app.get("/hospitals/dashboard", response_model=List[Dict[str, Any]], tags=["Hospitals"])
def get_hospitals_for_dashboard_endpoint():
    """
    Endpoint to get combined hospital name and address for the dashboard.
    """
    return get_hospitals_for_dashboard()

# ----------------- New Endpoint for ISO Certification Status ----------------- #
def get_iso_certification_status() -> List[Dict[str, Any]]:
    """
    Analyzes and returns the status of ISO 9001 certifications for all hospitals.
    """
    hospitals = read_json("hospitals.json")
    certifications = read_json("hospital_certifications.json")

    # Create a map for hospital names for quick lookup
    hospital_name_map = {h.get("id"): h.get("name") for h in hospitals}

    iso_cert_data = []
    today = date.today()

    for cert in certifications:
        if cert.get("certification_type") == "ISO 9001":
            hospital_id = cert.get("hospital_id")
            hospital_name = hospital_name_map.get(hospital_id, "Unknown Hospital")
            
            # Safely get the expiry date
            expiry_date_str = cert.get("expiry_date")
            is_valid = False
            
            if expiry_date_str:
                try:
                    expiry_date = datetime.strptime(expiry_date_str, "%Y-%m-%d").date()
                    is_valid = expiry_date >= today
                except ValueError:
                    # Handle malformed dates gracefully
                    is_valid = False

            iso_cert_data.append({
                "hospital_id": hospital_id,
                "hospital_name": hospital_name,
                "certificate_number": cert.get("certificate_number"),
                "issued_date": cert.get("issued_date"),
                "expiry_date": expiry_date_str,
                "status": "Valid" if is_valid else "Expired",
                "is_active": is_valid,
            })
    
    return iso_cert_data

@app.get("/hospitals/iso-certification", response_model=List[Dict[str, Any]], tags=["Certifications"])
def get_iso_certification_endpoint():
    """
    Endpoint to get all hospitals with ISO 9001 certification status (Valid/Expired).
    """
    return get_iso_certification_status()


# ----------------- New Endpoint for Critical Care Equipment Analysis ----------------- #
def get_critical_care_equipment_analysis_data() -> Dict[str, Any]:
    """
    Analyzes and returns the count of critical care equipment per hospital.
    """
    try:
        equipment_data = read_json("hospital_equipment.json")
        hospitals_data = read_json("hospitals.json")
    except HTTPException as e:
        return {"data": [], "equipmentTypes": []}

    # Map hospital IDs to names for the final output
    hospital_name_map = {h.get("id"): h.get("name") for h in hospitals_data if h.get("id")}
    
    # Use a defaultdict to aggregate counts for each equipment type per hospital
    equipment_by_hospital = defaultdict(lambda: defaultdict(int))
    
    # Collect all unique equipment names
    all_critical_care_equipment_types = set()

    # Filter for critical care equipment and aggregate data
    for item in equipment_data:
        if item.get("category") == "Critical Care":
            hospital_id = item.get("hospital_id")
            equipment_name = item.get("equipment_name")
            quantity = item.get("quantity", 0)
            
            if hospital_id and equipment_name:
                equipment_by_hospital[hospital_id][equipment_name] += quantity
                all_critical_care_equipment_types.add(equipment_name)

    # Structure the data for the stacked bar chart
    structured_data = []
    sorted_equipment_types = sorted(list(all_critical_care_equipment_types))

    for hosp_id, equipment_counts in equipment_by_hospital.items():
        hospital_name = hospital_name_map.get(hosp_id, "Unknown Hospital")
        
        # Create a dictionary for the equipment counts, including 0 for missing types
        equipment_status = {
            eq_type: equipment_counts.get(eq_type, 0)
            for eq_type in sorted_equipment_types
        }

        structured_data.append({
            "name": hospital_name,
            "id": hosp_id,
            **equipment_status # Flatten the equipment counts into the main dictionary
        })

    return {
        "data": structured_data,
        "equipmentTypes": sorted_equipment_types
    }


@app.get("/equipment/critical-care", response_model=Dict[str, Any], tags=["Equipment"])
def get_critical_care_equipment_endpoint():
    """
    Endpoint to get the distribution of critical care equipment across hospitals.
    """
    data = get_critical_care_equipment_analysis_data()
    return data
    
def get_city_medical_coverage_data() -> List[Dict[str, Any]]:
    """
    Reads hospital data from JSON files, joins the data by hospital ID,
    and aggregates the number of hospitals and total registered beds per city.
    """
    try:
        hospitals = read_json("hospitals.json")
        addresses = read_json("hospital_addresses.json")
    except HTTPException:
        return []

    # Create a robust mapping from hospital_id to city_town using the first found address
    hospital_city_map = {}
    for address in addresses:
        hospital_id = address.get('hospital_id')
        city_town = address.get('city_town')
        
        if hospital_id and city_town and hospital_id not in hospital_city_map:
            hospital_city_map[hospital_id] = city_town

    # Aggregate hospital count and bed capacity by city
    city_coverage = defaultdict(lambda: {
        'city': '', 
        'hospital_count': 0, 
        'total_beds': 0
    })

    for hospital in hospitals:
        hospital_id = hospital.get('id')
        beds_registered = hospital.get('beds_registered', 0)

        city = hospital_city_map.get(hospital_id)
        if city:
            city_coverage[city]['city'] = city
            city_coverage[city]['hospital_count'] += 1
            city_coverage[city]['total_beds'] += beds_registered

    # Convert the dictionary values to a list for the final JSON response
    return list(city_coverage.values())

@app.get("/city-wise-medical-coverage", response_model=List[Dict[str, Any]], tags=["Hospitals"])
def get_city_wise_medical_coverage_endpoint():
    """
    Returns the number of hospitals and total bed capacity, grouped by city.
    """
    return get_city_medical_coverage_data()


# ----------------- New Endpoint for Hospitals by City ----------------- #
def get_hospitals_by_city() -> Dict[str, List[Dict[str, Any]]]:
    """
    Reads hospital and address data, then groups hospitals by city.
    """
    try:
        hospitals_data = read_json("hospitals.json")
        addresses_data = read_json("hospital_addresses.json")
    except HTTPException:
        return {}

    # Map hospital IDs to their address details for quick lookup
    addresses_map = {}
    for addr in addresses_data:
        hospital_id = addr.get("hospital_id")
        if hospital_id and hospital_id not in addresses_map:
            addresses_map[hospital_id] = addr

    # Group hospitals by city
    hospitals_by_city = defaultdict(list)
    for hosp in hospitals_data:
        hosp_id = hosp.get("id")
        address = addresses_map.get(hosp_id)
        
        if address and address.get("city_town"):
            city = address.get("city_town")
            hospitals_by_city[city].append({
                "id": hosp.get("id"),
                "name": hosp.get("name", "Unknown"),
                "beds_registered": hosp.get("beds_registered", 0),
                "address": address
            })
    
    return dict(hospitals_by_city)


@app.get("/hospitals/by-city", response_model=Dict[str, List[Dict[str, Any]]], tags=["Hospitals"])
def get_hospitals_by_city_endpoint():
    """
    Returns a dictionary of cities, with each city containing a list of its hospitals.
    """
    return get_hospitals_by_city()

@app.get("/api/wards-rooms")
def get_wards_rooms():
    """
    Reads the wards_rooms.json, hospitals.json, and hospital_addresses.json files,
    combining the data to include hospital names and addresses in the response.
    """
    # Use the existing read_json utility for consistent file handling and error management
    wards_data = read_json("wards_rooms.json")
    hospitals_data = read_json("hospitals.json")
    addresses_data = read_json("hospital_addresses.json")

    # Create dictionaries for efficient lookup
    hospitals_dict = {h['id']: h for h in hospitals_data}
    addresses_dict = {address.get('hospital_id'): address for address in addresses_data if address.get('address_type') == 'Primary'}

    # Combine data
    enriched_data = []
    for ward in wards_data:
        hospital_id = ward.get('hospital_id')
        
        # Ensure the hospital_id exists in our lookup dictionaries before proceeding
        if hospital_id in hospitals_dict and hospital_id in addresses_dict:
            hospital_details = hospitals_dict[hospital_id]
            address_details = addresses_dict[hospital_id]
            
            ward['hospital_name'] = hospital_details.get('name', 'N/A')
            ward['hospital_address'] = {
                "street": address_details.get("street", "N/A"),
                "city": address_details.get("city_town", "N/A"),
                "state": address_details.get("state", "N/A"),
                "pin_code": address_details.get("pin_code", "N/A")
            }
            enriched_data.append(ward)
            
    return enriched_data

@app.get("/")
def read_root():
    return {"message": "Welcome to the Hospital Data API!"}

# ----------------- New Service and Endpoint for Equipment Maintenance ----------------- #
def get_equipment_maintenance_data():
    """
    Reads equipment, hospital, and address data, calculates next maintenance due dates,
    and enriches equipment data with hospital names and location details.
    """
    equipment_data = read_json("hospital_equipment.json")
    hospitals_data = read_json("hospitals.json")
    addresses_data = read_json("hospital_addresses.json")
    
    # Create mappings for easy lookup
    hospital_name_map = {hospital.get('id'): hospital.get('name') for hospital in hospitals_data}
    address_map = {addr.get('hospital_id'): addr for addr in addresses_data}

    # Define the mapping for maintenance schedules to days
    maintenance_intervals = {
        "Monthly": 30,
        "Quarterly": 91,
        "Bi-annual": 182,
        "Annual": 365
    }

    processed_equipment = []
    # Process each equipment item
    for item in equipment_data:
        start_date_str = item.get("created_at")
        schedule = item.get("maintenance_schedule")
        hosp_id = item.get("hospital_id")

        # Skip items without a valid created_at timestamp or maintenance schedule
        if not start_date_str or not schedule or schedule not in maintenance_intervals:
            continue
        
        # Parse the created_at date and calculate the next due date
        start_date = datetime.fromisoformat(start_date_str.replace("Z", "+00:00"))
        days_to_add = maintenance_intervals[schedule]
        next_due_date = start_date + timedelta(days=days_to_add)
        
        # Get hospital name and address details
        hospital_name = hospital_name_map.get(hosp_id, "Unknown Hospital")
        address = address_map.get(hosp_id, {})
        
        processed_item = {
            "id": item.get("id"),
            "equipment_name": item.get("equipment_name"),
            "hospital_id": hosp_id,
            "hospital_name": hospital_name,
            "city": address.get('city_town', 'N/A'),
            "state": address.get('state', 'N/A'),
            "category": item.get("category"),
            "equipment_details": item.get("equipment_details"),
            "brand_model": item.get("brand_model"),
            "specification": item.get("specification"),
            "quantity": item.get("quantity"),
            "installation_year": item.get("installation_year"),
            "is_available": item.get("is_available"),
            "is_active": item.get("is_active"),
            "maintenance_schedule": schedule,
            "next_due_date": next_due_date.isoformat(),
            "created_at": item.get("created_at")
        }
        processed_equipment.append(processed_item)

    return processed_equipment

@app.get("/equipment/maintenance-schedule", response_model=List[Dict[str, Any]], tags=["Equipment"])
def get_equipment_maintenance_schedule_endpoint():
    """
    API endpoint to retrieve equipment maintenance schedules with
    calculated next due dates.
    """
    data = get_equipment_maintenance_data()
    return data

@app.get("/hospitals", response_model=List[Dict[str, Any]], tags=["Hospitals"])
def get_all_hospitals():
    return read_json("hospitals.json")

# ----------------- New Endpoint for Hospital Risk Profile Dashboard ----------------- #

def get_hospital_risk_profile_data(hospital_id: int) -> Dict[str, Any]:
    """
    Analyzes all relevant data to calculate a comprehensive risk profile for a single hospital.
    
    This function has been revised to be more robust against missing data and
    to align the output structure with the frontend's expectations.
    """
    try:
        # Load all necessary data using the existing utility function
        hospitals_data = read_json("hospitals.json")
        certifications_data = read_json("hospital_certifications.json")
        metrics_data = read_json("hospital_metrics.json")
        documents_data = read_json("document_uploads.json")
        addresses_data = read_json("hospital_addresses.json")
        
        # Find the specific hospital and its related data, using robust defaults
        hospital = next((h for h in hospitals_data if h.get('id') == hospital_id), None)
        if not hospital:
            raise HTTPException(status_code=404, detail="Hospital not found.")
            
        address = next((a for a in addresses_data if a.get('hospital_id') == hospital_id and a.get('address_type') == 'Primary'), {})
        certifications = [c for c in certifications_data if c.get('hospital_id') == hospital_id]
        metrics = next((m for m in metrics_data if m.get('hospital_id') == hospital_id), {})
        documents = [d for d in documents_data if d.get('entity_id') == hospital_id and d.get('entity_type') == 'hospital']
        
        # 1. Calculate Metrics Risk Score (based on staffing and operational metrics)
        metrics_risk_score = 0
        metrics_sub_score = 0
        
        # Define and calculate individual sub-scores
        doctor_bed_ratio_score = (1 - metrics.get('doctor_bed_ratio', 1)) * 5
        nurse_bed_ratio_score = (1 - metrics.get('nurse_bed_ratio', 1)) * 5
        icu_doctor_bed_ratio_score = (1 - metrics.get('icu_doctor_bed_ratio', 1)) * 5
        icu_nurse_bed_ratio_score = (1 - metrics.get('icu_nurse_bed_ratio', 1)) * 5
        
        metrics_risk_score = doctor_bed_ratio_score + nurse_bed_ratio_score + icu_doctor_bed_ratio_score + icu_nurse_bed_ratio_score
        metrics_sub_score = metrics_risk_score
        
        # 2. Calculate Certification Risk Score
        certification_risk_score = 0
        today = date.today()
        cert_details = []
        for cert in certifications:
            is_expired = False
            expiry_date_str = cert.get('expiry_date')
            if expiry_date_str:
                try:
                    expiry_date = datetime.strptime(expiry_date_str, "%Y-%m-%d").date()
                    if expiry_date < today:
                        is_expired = True
                        certification_risk_score += 10 # High penalty for expired cert
                except ValueError:
                    certification_risk_score += 5 # Lower penalty for malformed date
            
            # Prepare status for frontend
            status = "Expired" if is_expired else "Valid"
            cert_details.append({
                "id": cert.get("id"),
                "certification_type": cert.get("certification_type"),
                "status": status
            })

        # 3. Calculate Document Verification Risk Score
        document_risk_score = 0
        unverified_documents = []
        for doc in documents:
            if not doc.get('is_verified', True):
                document_risk_score += 5  # Add a penalty for each unverified document
                unverified_documents.append(doc)
        
        # 4. Total Risk Score
        total_risk_score = metrics_risk_score + certification_risk_score + document_risk_score

        # 5. Assign Risk Category
        risk_category = "Low"
        if total_risk_score >= 20:
            risk_category = "High"
        elif total_risk_score >= 10:
            risk_category = "Medium"
        
        # Final response data, structured for the frontend
        return {
            "hospital_id": hospital_id,
            "name": hospital.get('name'),
            "address": f"{address.get('street', 'N/A')}, {address.get('area_locality', 'N/A')}, {address.get('city_town', 'N/A')}, {address.get('state', 'N/A')} - {address.get('pin_code', 'N/A')}",
            "total_risk_score": round(total_risk_score, 2),
            "risk_category": risk_category,
            "metrics_risk_score": round(metrics_risk_score, 2),
            "metrics_sub_score": round(metrics_sub_score, 2),
            "certification_risk_score": round(certification_risk_score, 2),
            "document_risk_score": document_risk_score,
            "metrics": {
                "doctor_bed_ratio": metrics.get('doctor_bed_ratio'),
                "nurse_bed_ratio": metrics.get('nurse_bed_ratio'),
                "icu_doctor_bed_ratio": metrics.get('icu_doctor_bed_ratio'),
                "icu_nurse_bed_ratio": metrics.get('icu_nurse_bed_ratio'),
                "doctor_bed_ratio_score": round(doctor_bed_ratio_score, 2),
                "nurse_bed_ratio_score": round(nurse_bed_ratio_score, 2),
                "icu_doctor_bed_ratio_score": round(icu_doctor_bed_ratio_score, 2),
                "icu_nurse_bed_ratio_score": round(icu_nurse_bed_ratio_score, 2),
            },
            "certifications": cert_details,
            "unverified_documents": unverified_documents
        }

    except HTTPException:
        # Re-raise explicit HTTPException
        raise
    except Exception as e:
        # Catch all other unhandled exceptions and return a clean server error
        print(f"An unhandled error occurred in get_hospital_risk_profile_data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check logs for details.")

@app.get("/api/hospitals/risk-profile/{hospital_id}", response_model=Dict[str, Any], tags=["Hospitals"])
def get_hospital_risk_profile_endpoint(hospital_id: int):
    """
    Endpoint to retrieve a comprehensive risk profile for a selected hospital.
    """
    return get_hospital_risk_profile_data(hospital_id)

# ----------------- New Function and Endpoint for List View ----------------- #

def get_all_hospitals_data() -> List[Dict[str, Any]]:
    """
    Retrieves a simplified list of all hospitals with their primary risk scores
    for the dashboard overview.
    """
    try:
        hospitals_data = read_json("hospitals.json")
        certifications_data = read_json("hospital_certifications.json")
        metrics_data = read_json("hospital_metrics.json")
        documents_data = read_json("document_uploads.json")
        addresses_data = read_json("hospital_addresses.json")

        all_hospitals_summary = []

        for hospital in hospitals_data:
            hospital_id = hospital.get('id')
            
            # Find related data for this hospital
            address = next((a for a in addresses_data if a.get('hospital_id') == hospital_id and a.get('address_type') == 'Primary'), {})
            certifications = [c for c in certifications_data if c.get('hospital_id') == hospital_id]
            metrics = next((m for m in metrics_data if m.get('hospital_id') == hospital_id), {})
            documents = [d for d in documents_data if d.get('entity_id') == hospital_id and d.get('entity_type') == 'hospital']
            
            # Calculate scores (reusing the same logic)
            metrics_risk_score = ((1 - metrics.get('doctor_bed_ratio', 1)) * 5) + \
                                 ((1 - metrics.get('nurse_bed_ratio', 1)) * 5) + \
                                 ((1 - metrics.get('icu_doctor_bed_ratio', 1)) * 5) + \
                                 ((1 - metrics.get('icu_nurse_bed_ratio', 1)) * 5)
                                 
            certification_risk_score = 0
            today = date.today()
            for cert in certifications:
                expiry_date_str = cert.get('expiry_date')
                if expiry_date_str:
                    try:
                        expiry_date = datetime.strptime(expiry_date_str, "%Y-%m-%d").date()
                        if expiry_date < today:
                            certification_risk_score += 10
                    except ValueError:
                        certification_risk_score += 5

            document_risk_score = len([doc for doc in documents if not doc.get('is_verified', True)]) * 5
            
            total_risk_score = metrics_risk_score + certification_risk_score + document_risk_score
            
            risk_category = "Low"
            if total_risk_score >= 20:
                risk_category = "High"
            elif total_risk_score >= 10:
                risk_category = "Medium"

            # Append simplified profile to the list
            all_hospitals_summary.append({
                "id": hospital_id,
                "name": hospital.get('name'),
                "address": f"{address.get('street', 'N/A')}, {address.get('area_locality', 'N/A')}, {address.get('city_town', 'N/A')}",
                "total_risk_score": round(total_risk_score, 2),
                "risk_category": risk_category,
            })
        
        return all_hospitals_summary
    
    except Exception as e:
        print(f"An unhandled error occurred in get_all_hospitals_data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching hospital list.")


@app.get("/api/hospitals/list", response_model=List[Dict[str, Any]], tags=["Hospitals"])
def get_all_hospitals_endpoint():
    """
    Endpoint to retrieve a simplified list of all hospitals for the dashboard overview.
    """
    return get_all_hospitals_data()

def get_surgical_capacity():
    """
    Calculates and returns the surgical capacity of hospitals by combining data
    from multiple JSON files.

    Returns:
        A JSON string containing an array of hospital objects with their
        calculated surgical capacity scores, names, and locations.
    """
    try:
        # Get the directory of the current script
        script_dir = Path(__file__).parent
        
        # Define paths to the JSON files, now correctly including the 'data' subdirectory
        data_dir = script_dir / 'data'
        hospitals_path = data_dir / 'hospitals.json'
        addresses_path = data_dir / 'hospital_addresses.json'
        equipment_path = data_dir / 'hospital_equipment.json'
        specialties_path = data_dir / 'medical_specialties.json'
        doctors_path = data_dir / 'doctors.json'

        # Load all JSON data from files
        with open(hospitals_path, 'r', encoding='utf-8') as f:
            hospitals_data = json.load(f)
        with open(addresses_path, 'r', encoding='utf-8') as f:
            addresses_data = json.load(f)
        with open(equipment_path, 'r', encoding='utf-8') as f:
            equipment_data = json.load(f)
        with open(specialties_path, 'r', encoding='utf-8') as f:
            specialties_data = json.load(f)
        with open(doctors_path, 'r', encoding='utf-8') as f:
            doctors_data = json.load(f)

        # Create dictionaries for efficient data lookup
        hospitals_map = {h['id']: {'name': h['name']} for h in hospitals_data}
        addresses_map = {a['hospital_id']: a for a in addresses_data if a.get('address_type') == 'Primary'}
        specialties_map = {s['id']: s for s in specialties_data if s.get('is_available')}
        
        # Identify surgical specialty IDs
        surgical_specialty_ids = {
            s_id for s_id, s_info in specialties_map.items() 
            if s_info.get('specialty_category') == 'Surgery'
        }

        # Initialize a dictionary to hold the combined data
        surgical_capacity_results = {h_id: {
            'hospital_id': h_id,
            'surgical_equipment_count': 0,
            'surgical_specialties_count': 0,
            'surgeon_count': 0,
        } for h_id in hospitals_map.keys()}

        # Tally surgical equipment
        for equip in equipment_data:
            hospital_id = equip.get('hospital_id')
            if equip.get('category') == 'Surgery' and hospital_id in surgical_capacity_results:
                quantity = equip.get('quantity', 1)
                surgical_capacity_results[hospital_id]['surgical_equipment_count'] += quantity

        # Tally surgical specialties
        for specialty in specialties_data:
            hospital_id = specialty.get('hospital_id')
            if specialty.get('specialty_category') == 'Surgery' and hospital_id in surgical_capacity_results:
                surgical_capacity_results[hospital_id]['surgical_specialties_count'] += 1

        # Tally surgeons based on surgical specialties
        for doctor in doctors_data:
            hospital_id = doctor.get('hospital_id')
            specialty_id = doctor.get('specialty_id')
            if hospital_id in surgical_capacity_results and specialty_id in surgical_specialty_ids:
                surgical_capacity_results[hospital_id]['surgeon_count'] += 1

        # Finalize results with hospital names, addresses, and total score
        final_output = []
        for hospital_id, data in surgical_capacity_results.items():
            if hospital_id in hospitals_map and hospital_id in addresses_map:
                hospital_info = hospitals_map[hospital_id]
                address_info = addresses_map[hospital_id]
                
                data['hospital_name'] = hospital_info.get('name')
                data['city_town'] = address_info.get('city_town')
                data['state'] = address_info.get('state')
                
                # Calculate final score
                data['surgical_capacity_score'] = (
                    data['surgical_equipment_count'] +
                    data['surgical_specialties_count'] +
                    data['surgeon_count']
                )
                final_output.append(data)
                
        # Return the final JSON output
        return final_output

    except FileNotFoundError as e:
        # Provide a more specific error message based on which file was not found
        raise HTTPException(status_code=404, detail=f"Required file not found: {e.filename}. Please ensure all JSON files are in the 'data' directory.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred: {str(e)}")

@app.get('/api/hospitals/surgical-capacity')
def surgical_capacity_endpoint():
    return get_surgical_capacity()

def load_json_data(file_name):
    """
    Helper function to load data from a JSON file.
    """
    if os.path.exists(file_name):
        with open(file_name, 'r') as f:
            return json.load(f)
    else:
        # In a real application, you might raise an error or log a warning here.
        return []

