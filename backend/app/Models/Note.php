<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Note extends Model
{
    use HasFactory;

    protected $fillable = [
        'id','claim_id','notes', 'notes_type','user','created_at', 'updated_at','created_by','updated_by','deleted_at'
    ];
}
