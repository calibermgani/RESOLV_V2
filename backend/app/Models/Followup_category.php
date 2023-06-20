<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Followup_category extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'name','label_name','status', 'created_by'
    ];
}
