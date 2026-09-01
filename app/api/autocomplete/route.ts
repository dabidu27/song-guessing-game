import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/create_pool";

export async function GET(req: NextRequest){

    const query = req.nextUrl.searchParams.get('q');
    if(!query || query.trim().length < 2){
        return NextResponse.json({results: []});
    }

    const result = await pool.query('select id, title, artist from songs where title ilike $1 or artist ilike $1 limit 8', [`%${query}%`]); //%query% means containing query anywhere in the word
    
    return NextResponse.json({results: result.rows});
}