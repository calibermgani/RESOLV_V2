<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Process_note extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = "process_notes";

    protected $fillable = [
        'claim_id','state','claim_status','content','created_by'
    ];
}
