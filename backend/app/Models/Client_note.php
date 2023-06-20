<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client_note extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'claim_id','state','content','created_by'
    ];
}
