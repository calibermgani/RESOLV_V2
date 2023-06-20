<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Claim_history extends Model
{
    use HasFactory;

    protected $fillable = [
        'claim_id','claim_state','assigned_by','assigned_to', 'created_at'
    ];
}
