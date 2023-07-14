<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Address_flag extends Model
{
    use HasFactory;

    protected $connection = 'mysql2';
    protected $fillable = [
        'address_company', 'type', 'address_line_1', 'address_line_2', 'city', 'state', 'zip5', 'zip4', 'is_address_match', 'updated_at'
    ];
}
