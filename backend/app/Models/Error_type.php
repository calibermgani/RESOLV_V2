<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Error_type extends Model
{
    use HasFactory;

    protected $fillable = [
        'id','name','status','created_by','updated_at','updated_by'
    ];
}
