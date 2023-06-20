<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Root_cause extends Model
{
    use HasFactory;

    protected $fillable = [
        'name','status','created_by','updated_at','updated_by'
    ];
}
