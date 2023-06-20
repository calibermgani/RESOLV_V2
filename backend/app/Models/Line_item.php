<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Line_item extends Model
{
    use HasFactory;

    protected $fillable = [
        'id','claim_id','total_ar_due', 'ins_ar','pat_ar','units', 'modifier','icd','cpt','dos','created_at','updated_at'
    ];
}
