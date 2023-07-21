<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Followup_template extends Model
{
    use HasFactory;

    protected $fillable = [
        'claim_id','rep_name','date','phone', 'insurance','category_id','content','created_by'
    ];

    public function insurance() {
        return $this->belongsTo('App\Models\Insurance', 'insurance_id', 'id');
    }
}
