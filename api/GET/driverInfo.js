router.get('/:id', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('assignedAmbulance');

    console.log('🚑 Driver fetched:', driver);

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json(driver);
  } catch (err) {
    console.error('Driver fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
