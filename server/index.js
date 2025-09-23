
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// --- Server Setup ---
const app = express();
app.use(cors());
app.use(express.json());

// --- Supabase Client ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);


// --- API Endpoints ---

// Login
app.post('/api/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('name', username)
            .single();

        if (error || !data) {
            return res.status(401).json({ message: "کاربر یافت نشد." });
        }
        if (data.password !== password) {
            return res.status(401).json({ message: "رمز عبور اشتباه است." });
        }
        res.json(data);
    } catch (err) {
        next(err);
    }
});


// --- Users API ---
app.get('/api/users', async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

app.post('/api/users', async (req, res, next) => {
    try {
        const { error } = await supabase.from('users').insert(req.body);
        if (error) throw error;
        res.status(201).send();
    } catch (err) {
        next(err);
    }
});

app.put('/api/users/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const { error } = await supabase.from('users').update(updateData).eq('id', id);
        if (error) throw error;
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

app.delete('/api/users/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw error;
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});


// --- Missions API ---
app.get('/api/missions', async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('missions').select('*');
        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

app.post('/api/missions', async (req, res, next) => {
    try {
        const {
            subject,
            location,
            starttime,
            endtime,
            assignedto,
            createdby,
            checklist
        } = req.body;

        if (!subject || !location || !starttime || !endtime || !assignedto || !createdby) {
            return res.status(400).json({ message: 'فیلدهای ماموریت ناقص است. لطفا تمام اطلاعات را وارد کنید.' });
        }

        const checkliststate = {};
        if (checklist && Array.isArray(checklist)) {
            checklist.forEach(categoryItem => {
                if(categoryItem.category && categoryItem.steps && Array.isArray(categoryItem.steps)) {
                    checkliststate[categoryItem.category] = {};
                    categoryItem.steps.forEach(step => {
                        checkliststate[categoryItem.category][step] = false;
                    });
                }
            });
        }
        
        const missionToInsert = {
            id: `M${Date.now()}`,
            subject,
            location,
            starttime,
            endtime,
            status: 'جدید',
            createdby,
            assignedto,
            createdat: new Date().toISOString(),
            checklist: checklist || [],
            checkliststate: checkliststate,
            reports: [],
            delegated_by: null,
            delegation_target: null,
            delegation_reason: null,
            delegation_status: null,
        };

        const { error } = await supabase.from('missions').insert(missionToInsert);

        if (error) {
             return next(error);
        }

        res.status(201).send();
    } catch (err) {
        next(err);
    }
});

app.put('/api/missions/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        delete updateData.id;

        const { error } = await supabase.from('missions').update(updateData).eq('id', id);
        if (error) throw error;
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

app.delete('/api/missions/user/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { error } = await supabase.from('missions').delete().eq('assignedto', userId);
        if (error) throw error;
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});


// --- Delegation Endpoints ---

// 1. Initiate Delegation
app.post('/api/missions/:missionId/delegate', async (req, res, next) => {
    try {
        const { missionId } = req.params;
        const { targetUserId, reason, initiatorId } = req.body;

        const { data: mission, error: fetchError } = await supabase.from('missions').select('*').eq('id', missionId).single();
        if (fetchError || !mission) return res.status(404).json({ message: 'ماموریت یافت نشد.'});
        if (mission.assignedto !== initiatorId) return res.status(403).json({ message: 'شما مسئول این ماموریت نیستید.'});
        
        const updateData = {
            delegated_by: initiatorId,
            delegation_target: targetUserId,
            delegation_reason: reason,
            delegation_status: 'PENDING',
        };

        const { data, error } = await supabase.from('missions').update(updateData).eq('id', missionId).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// 2. Accept Delegation
app.post('/api/missions/:missionId/accept', async (req, res, next) => {
    try {
        const { missionId } = req.params;
        const { userId } = req.body; // This is the user accepting the mission

        const { data: mission, error: fetchError } = await supabase.from('missions').select('*').eq('id', missionId).single();
        if (fetchError || !mission) return res.status(404).json({ message: 'ماموریت یافت نشد.'});
        if (mission.delegation_target !== userId) return res.status(403).json({ message: 'این ماموریت به شما ارجاع داده نشده است.'});

        const updateData = {
            assignedto: userId, // New user takes ownership
            delegation_status: 'ACCEPTED',
        };

        const { data, error } = await supabase.from('missions').update(updateData).eq('id', missionId).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// 3. Reject Delegation
app.post('/api/missions/:missionId/reject', async (req, res, next) => {
    try {
        const { missionId } = req.params;
        const { userId } = req.body; // This is the user rejecting the mission

        const { data: mission, error: fetchError } = await supabase.from('missions').select('*').eq('id', missionId).single();
        if (fetchError || !mission) return res.status(404).json({ message: 'ماموریت یافت نشد.'});
        if (mission.delegation_target !== userId) return res.status(403).json({ message: 'این ماموریت به شما ارجاع داده نشده است.'});
        
        const updateData = {
            delegation_status: 'REJECTED',
        };

        const { data, error } = await supabase.from('missions').update(updateData).eq('id', missionId).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// 4. Clear Delegation Status
app.post('/api/missions/:missionId/clear-delegation', async (req, res, next) => {
    try {
        const { missionId } = req.params;
        const { userId } = req.body; // This is the user clearing the status

        const { data: mission, error: fetchError } = await supabase.from('missions').select('*').eq('id', missionId).single();
        if (fetchError || !mission) return res.status(404).json({ message: 'ماموریت یافت نشد.'});
        if (mission.delegated_by !== userId) return res.status(403).json({ message: 'فقط ارجاع دهنده میتواند وضعیت را پاک کند.'});

        const updateData = {
            delegated_by: null,
            delegation_target: null,
            delegation_reason: null,
            delegation_status: null,
        };
        const { data, error } = await supabase.from('missions').update(updateData).eq('id', missionId).select().single();
        if (error) throw error;
        res.json(data);
    } catch(err) {
        next(err);
    }
});


// --- Global Error Handler ---
app.use((err, req, res, next) => {
    res.status(500).json({ 
        message: err.message || 'Internal Server Error',
        details: err.details,
        code: err.code,
    });
});


// --- Start Server ---
const PORT = 3001;
app.listen(PORT, () => {
    // Server start log removed for production
});
