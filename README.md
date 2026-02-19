# palanguzhi
Pallanguzhi's Python logic uses a 14-item list and a circular loop. Players pick a pit, then "sow" seeds using (index + 1) % 14. If the last seed lands in a full pit, a "relay" starts, picking those up to continue. If it hits an empty pit, the code checks the next one: if seeds are there, they’re "captured" to the score; if not, the turn ends.
