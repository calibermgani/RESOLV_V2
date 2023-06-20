<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Followup_question extends Model
{
    use HasFactory;

    protected $fillable = [
        'question','question_label','hint','category_id', 'field_type','field_validation','date_type', 'status','created_by'
    ];
}
