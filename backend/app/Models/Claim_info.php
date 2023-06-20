<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Claim_info extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'id','claim_number','patient_id', 'primary_ins_id','secondary_ins_id','tertiary_ins_id', 'rendering_provider','billing_provider','facility','dos_from','dos_to','admit_date','discharge_date', 'cpt','icd','modifier', 'units','total_charges','pat_ar','ins_ar','total_ar_due','claim_status','claim_sub_status','responsibility','created_at','updated_at','created_by','updated_by','deleted_at'
    ];
}
